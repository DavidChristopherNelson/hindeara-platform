#!/usr/bin/env bash
set -euo pipefail

API_KEY="$speechmatics_key"
LANG="hi"
TMP="$(mktemp)"
MASTER="all_transcripts.txt"
: > "$MASTER"                  # truncate master file

# Enable nullglob for Bash 3
if [ -n "${BASH_VERSION:-}" ]; then
  shopt -s nullglob
fi

submit_job () {
  local file="$1"
  job_json=$(curl -s -X POST "https://asr.api.speechmatics.com/v2/jobs/" \
      -H "Authorization: Bearer $API_KEY" \
      -F config='{"type":"transcription","transcription_config":{"language":"'"$LANG"'"}}' \
      -F data_file=@"$file")
  echo "$job_json" | jq -r '.id'
}

echo "▶️  Submitting audio files…"
file_count=0
for file in *.[mM][pP]3 *.[oO][gG][gG]; do
  [ -e "$file" ] || continue
  ((file_count++))
  echo "  • $file"
  job_id=$(submit_job "$file")
  echo "    → Job ID: $job_id"
  printf '%s|%s\n' "$job_id" "$file" >> "$TMP"
done

if (( file_count == 0 )); then
  echo "⚠️  No .mp3 or .ogg files found."; rm -f "$TMP"; exit 1
fi

echo -e "\n⏳  Polling every 10 s until all jobs are done…"
remaining=$file_count

while (( remaining > 0 )); do
  sleep 10
  new_tmp="$(mktemp)"
  while IFS='|' read -r job_id file; do
    status=$(curl -s "https://asr.api.speechmatics.com/v2/jobs/$job_id" \
                 -H "Authorization: Bearer $API_KEY" | jq -r '.job.status')

    if [[ "$status" == "done" ]]; then
      # fetch transcript text
      transcript=$(curl -s \
        "https://asr.api.speechmatics.com/v2/jobs/$job_id/transcript?format=txt" \
        -H "Authorization: Bearer $API_KEY")
      echo -e "\n===== $file =====\n$transcript" | tee -a "$MASTER"
      printf '%s\n' "$transcript" > "${file%.*}.txt"
      ((remaining--))
    else
      # still pending; keep in temp list for next poll
      printf '%s|%s\n' "$job_id" "$file" >> "$new_tmp"
    fi
  done < "$TMP"
  mv "$new_tmp" "$TMP"
done

rm -f "$TMP"
echo -e "\n✅  Finished. Consolidated output →  $MASTER"
