from collections import defaultdict


def allocate_inventory(order_items, inventory):
    """
    Allocate inventory using FIFO.

    Returns:

    {
        "MR-0001": {

            "BOX-A": {

                "SKU-001": [

                    {
                        "order_no": "...",
                        "order_item_id": 1,
                        "sku": "SKU-001",
                        "serial_no": "ABC001",
                        "inventory": Inventory
                    }

                ],

                "SKU-002": [
                    ...
                ]
            }

        }
    }

    shortages = [
        {
            "order_no": "...",
            "sku": "...",
            "required": 5,
            "available": 3
        }
    ]
    """

    # -----------------------------------------
    # Group available inventory by SKU
    # -----------------------------------------

    inventory_by_sku = defaultdict(list)

    for inv in inventory:
        inventory_by_sku[inv.sku].append(inv)

    # -----------------------------------------
    # Final allocation structure
    # Location
    #     Box
    #         SKU
    #             Serials
    # -----------------------------------------

    allocation = defaultdict(
        lambda: defaultdict(
            lambda: defaultdict(list)
        )
    )

    shortages = []

    # -----------------------------------------
    # Allocate every order
    # -----------------------------------------

    for order in order_items:

        available_inventory = inventory_by_sku[order.sku]

        available_qty = len(available_inventory)

        # Check shortage
        if available_qty < order.required_qty:

            shortages.append({

                "order_no": order.order_no,

                "sku": order.sku,

                "required": order.required_qty,

                "available": available_qty

            })

        allocate_qty = min(
            order.required_qty,
            available_qty
        )

        # FIFO Allocation
        for _ in range(allocate_qty):

            inv = available_inventory.pop(0)

            allocation[
                inv.location
            ][
                inv.box
            ][
                order.sku
            ].append({

                "order_no": order.order_no,

                "order_item_id": order.id,

                "sku": order.sku,

                "serial_no": inv.serial_no,

                "inventory": inv

            })

    return allocation, shortages