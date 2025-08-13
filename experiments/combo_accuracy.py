import json
import itertools
from collections import defaultdict
from typing import Dict, Iterable, List, Tuple, Set

INPUT_PATH = "experiments/experimentData.json"           # change if needed
EXCLUDE_STATES: Set[str] = {"letter", "letterImage"}         # match your other script

def load_events(path: str):
    with open(path, "r", encoding="utf-8") as f:
        rows = json.load(f)
    # keep parity with your other code
    return [r for r in rows if r.get("state") not in EXCLUDE_STATES]

def build_matrix(rows: List[dict]) -> Tuple[Dict[int, Dict[str, bool]], List[str]]:
    """
    Matrix: event_id -> { service -> computerAssessment(bool) }
    Also returns sorted list of services.
    """
    by_event: Dict[int, Dict[str, bool]] = defaultdict(dict)
    services = set()
    for r in rows:
        event_id = int(r["appEventId"])
        service = str(r["service"])
        ok = bool(r["computerAssessment"])
        by_event[event_id][service] = ok
        services.add(service)
    return by_event, sorted(services)

def accuracy_for_services(
    by_event: Dict[int, Dict[str, bool]], services: Iterable[str]
) -> Tuple[int, int, float]:
    """
    Combined accuracy for a set of services:
    - Count an event if at least one of these services ran for that event.
    - Mark correct if any of those available results is True.
    """
    svc = tuple(services)
    correct = 0
    total = 0
    for service_map in by_event.values():
        present_vals = [service_map[s] for s in svc if s in service_map]
        if not present_vals:
            continue
        total += 1
        if any(present_vals):
            correct += 1
    pct = (correct / total) * 100 if total else 0.0
    return correct, total, pct

def rank_and_print(
    by_event: Dict[int, Dict[str, bool]],
    all_services: List[str],
    k: int,
    top_n: int = 10,
):
    results = []
    for combo in itertools.combinations(all_services, k):
        correct, total, pct = accuracy_for_services(by_event, combo)
        if total == 0:
            continue
        results.append((pct, correct, total, combo))

    # Sort by accuracy desc, then #correct desc, then lexical combo name
    results.sort(key=lambda x: (-x[0], -x[1], x[3]))

    print(f"\nTop {min(top_n, len(results))} combinations for groups of {k}:")
    for i, (pct, correct, total, combo) in enumerate(results[:top_n], start=1):
        print(f"{i:>2}. {', '.join(combo):<60} {pct:6.2f}%  ({correct}/{total})")

def main():
    rows = load_events(INPUT_PATH)
    by_event, all_services = build_matrix(rows)

    # Individual services — sort by accuracy descending
    print("Accuracy by individual service (highest to lowest):")
    indiv_results = []
    for s in all_services:
        correct, total, pct = accuracy_for_services(by_event, [s])
        indiv_results.append((pct, correct, total, s))
    indiv_results.sort(key=lambda x: (-x[0], -x[1], x[3]))
    for pct, correct, total, s in indiv_results:
        print(f" - {s:<20} {pct:6.2f}%  ({correct}/{total})")

    # All combinations: pairs up to ALL services (includes 7 if there are 7)
    for k in range(2, len(all_services) + 1):
        rank_and_print(by_event, all_services, k, top_n=10)

    # Sanity check: ALL SERVICES combined (single line)
    all_correct, all_total, all_pct = accuracy_for_services(by_event, all_services)
    print("\nAll services combined (parity check with your other script):")
    print(f"  {all_pct:.2f}% ({all_correct}/{all_total})")

if __name__ == "__main__":
    main()
