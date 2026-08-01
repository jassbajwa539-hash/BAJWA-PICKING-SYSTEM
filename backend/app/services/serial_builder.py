from app.models.pick_serials import PickSerial


def build_pick_serials(db, task_map):
    """
    Create PickSerial records and reserve inventory.

    task_map format:

    {
        (
            location,
            box,
            sku,
            order_no
        ):
        {
            "task": PickTask,
            "rows": [...]
        }
    }
    """

    serials = []

    reserved_inventory = []

    for value in task_map.values():

        task = value["task"]

        rows = value["rows"]

        for row in rows:

            serials.append(

                PickSerial(

                    task_id=task.id,

                    serial_no=row["serial_no"],

                    status="PENDING"

                )

            )

            inventory = row["inventory"]

            inventory.status = "RESERVED"

            inventory.picked_order = task.order_no

            reserved_inventory.append(inventory)

    if serials:
        db.bulk_save_objects(serials)

    db.commit()

    return {
        "serials_created": len(serials),
        "inventory_reserved": len(reserved_inventory)
    }