from confluent_kafka import Consumer
import json, os

class EventConsumer:
    def __init__(self, group_id: str, topics: list[str]):
        self._consumer = Consumer({
            "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS"),
            "group.id": group_id,
            "auto.offset.reset": "earliest"  # replay from start if new consumer
        })
        self._consumer.subscribe(topics)

    def listen(self, handler):
        while True:
            msg = self._consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                print(f"Consumer error: {msg.error()}")
                continue
            payload = json.loads(msg.value().decode("utf-8"))
            handler(payload)
