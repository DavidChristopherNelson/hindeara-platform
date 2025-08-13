import json
import math

def calculate_service_stats(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    stats = {}
    for entry in data:
        service = entry["service"]
        correct = entry["computerAssessment"]
        response_time = entry["responseTime"]
        state = entry["state"]  # NEW

        if service not in stats:
            stats[service] = {
                "total": 0,
                "correct": 0,
                "times": [],
                "states": {}  # NEW: hold per-state tallies
            }

        # overall tallies
        stats[service]["total"] += 1
        if correct:
            stats[service]["correct"] += 1
        stats[service]["times"].append(response_time)

        # NEW: per-state tallies
        if state not in stats[service]["states"]:
            stats[service]["states"][state] = {"total": 0, "correct": 0}
        stats[service]["states"][state]["total"] += 1
        if correct:
            stats[service]["states"][state]["correct"] += 1

    # Calculate and print statistics
    print("Service Performance Statistics:\n")
    for service, counts in stats.items():
        total = counts["total"]
        correct = counts["correct"]
        times = counts["times"]

        percentage = (correct / total) * 100 if total > 0 else 0
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        # Standard deviation (population formula)
        variance = sum((t - avg_time) ** 2 for t in times) / len(times)
        std_dev = math.sqrt(variance)

        print(f"{service}:")
        print(f"  Accuracy: {percentage:.2f}% ({correct}/{total})")
        print(f"  Avg Response Time: {avg_time:.3f}s")
        print(f"  Std Dev Response Time: {std_dev:.3f}s")
        print(f"  Min Response Time: {min_time:.3f}s")
        print(f"  Max Response Time: {max_time:.3f}s")

        # NEW: per-state accuracy output
        if counts["states"]:
            print(f"  Accuracy by State:")
            for state, sc in counts["states"].items():
                st_total = sc["total"]
                st_correct = sc["correct"]
                st_pct = (st_correct / st_total) * 100 if st_total > 0 else 0
                print(f"    {state}: {st_pct:.2f}% ({st_correct}/{st_total})")

        print()  # blank line between services


if __name__ == "__main__":
    calculate_service_stats("experiments/experimentData.json")
