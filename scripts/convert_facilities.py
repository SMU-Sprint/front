#!/usr/bin/env python3
import csv
import json
import math
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: convert_facilities.py SOURCE.csv TARGET.json")

    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    facilities = []
    skipped = 0

    with source.open("r", encoding="utf-8-sig", newline="") as csv_file:
        for row in csv.DictReader(csv_file):
            try:
                latitude = float(row["latitude"])
                longitude = float(row["longitude"])
            except (KeyError, TypeError, ValueError):
                skipped += 1
                continue

            if not (
                math.isfinite(latitude)
                and math.isfinite(longitude)
                and -90 <= latitude <= 90
                and -180 <= longitude <= 180
            ):
                skipped += 1
                continue

            facilities.append(
                {
                    "id": row["facility_id"].strip(),
                    "name": row["facility_name"].strip(),
                    "type": row["facility_type_name"].strip(),
                    "address": row["address"].strip(),
                    "lng": longitude,
                    "lat": latitude,
                }
            )

    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8", newline="\n") as json_file:
        json.dump(facilities, json_file, ensure_ascii=False, separators=(",", ":"))
        json_file.write("\n")

    print(
        f"converted={len(facilities)} skipped={skipped} "
        f"source={source} target={target}"
    )


if __name__ == "__main__":
    main()
