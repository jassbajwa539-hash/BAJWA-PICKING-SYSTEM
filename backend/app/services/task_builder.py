from collections import defaultdict

from app.models.pick_tasks import PickTask


def build_pick_tasks(db, locations):
    """
    Build PickTask records.

    One Task =
        Order
        +
        SKU
        +
        Location
        +
        Box

    Returns

    {
        (location, box, sku, order_no): task
    }
    """

    tasks = []

    task_map = {}

    sequence = 1

    for location_data in locations:

        location = location_data["location"]

        for box_data in location_data["boxes"]:

            box = box_data["box"]

            for sku_data in box_data["items"]:

                sku = sku_data["sku"]

                grouped_orders = defaultdict(list)

                # Group every allocated serial by Order
                for row in sku_data["rows"]:

                    grouped_orders[
                        row["order_no"]
                    ].append(row)

                # Create one task per order
                for order_no, rows in grouped_orders.items():

                    task = PickTask(

                        order_no=order_no,

                        order_item_id=rows[0]["order_item_id"],

                        sku=sku,

                        location=location,

                        box=box,

                        required_qty=len(rows),

                        picked_qty=0,

                        status="PENDING",

                        sequence=sequence

                    )

                    tasks.append(task)

                    task_map[
                        (
                            location,
                            box,
                            sku,
                            order_no
                        )
                    ] = {

                        "task": task,

                        "rows": rows

                    }

                    sequence += 1

    db.bulk_save_objects(tasks)

    db.commit()

    created = (
        db.query(PickTask)
        .order_by(
            PickTask.sequence
        )
        .all()
    )

    # Update map with real DB IDs
    created_lookup = {}

    for task in created:

        created_lookup[
            (
                task.location,
                task.box,
                task.sku,
                task.order_no
            )
        ] = task

    for key in task_map.keys():

        task_map[key]["task"] = created_lookup[key]

    return task_map