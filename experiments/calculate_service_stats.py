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

        if service not in stats:
            stats[service] = {
                "total": 0,
                "correct": 0,
                "times": []
            }

        stats[service]["total"] += 1
        if correct:
            stats[service]["correct"] += 1
        stats[service]["times"].append(response_time)

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
        print(f"  Max Response Time: {max_time:.3f}s\n")


if __name__ == "__main__":
    calculate_service_stats("experiments/experimentData.json")
