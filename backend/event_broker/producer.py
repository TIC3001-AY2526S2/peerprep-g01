from confluent_kafka import Producer
from confluent_kafka.serialization import StringSerializer
import json, os

class EventProducer:
    def __init__(self):
        self._producer = Producer({
            "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS")
        })

    def publish(self, topic: str, payload: dict, key: str = None):
        self._producer.produce(
            topic=topic,
            key=key,                        # partition key — e.g. userId or sessionId
            value=json.dumps(payload).encode("utf-8"),
            callback=self._delivery_report
        )
        self._producer.flush()

    def _delivery_report(self, err, msg):
        if err:
            print(f"Delivery failed: {err}")
