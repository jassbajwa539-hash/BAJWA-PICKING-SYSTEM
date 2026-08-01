from collections import OrderedDict


def group_locations(allocation):
    """
    Convert allocation into warehouse route.

    Input
    =====

    {
        "MR-0001": {
            "BOX-A": {
                "SKU-A": [....],
                "SKU-B": [....]
            }
        }
    }

    Output
    ======

    [
        {
            "location":"MR-0001",
            "total_boxes":2,
            "total_skus":5,
            "total_serials":18,
            "boxes":[]
        }
    ]
    """

    locations = []

    # Warehouse Route
    for location in sorted(allocation.keys()):

        box_list = []

        sku_counter = 0
        serial_counter = 0

        for box in sorted(allocation[location].keys()):

            sku_list = []

            for sku in sorted(allocation[location][box].keys()):

                rows = allocation[location][box][sku]

                sku_counter += 1
                serial_counter += len(rows)

                sku_list.append({

                    "sku": sku,

                    "required_qty": len(rows),

                    "picked_qty": 0,

                    "rows": rows

                })

            box_list.append({

                "box": box,

                "total_skus": len(sku_list),

                "total_serials": sum(
                    x["required_qty"]
                    for x in sku_list
                ),

                "items": sku_list

            })

        locations.append({

            "location": location,

            "total_boxes": len(box_list),

            "total_skus": sku_counter,

            "total_serials": serial_counter,

            "boxes": box_list

        })

    return locations