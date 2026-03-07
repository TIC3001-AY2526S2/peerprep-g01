def individual_data(question):
    return{
        "id": str(question["_id"]),
        "title": question["title"],
        "description": question["description"],
        "category": question["category"],
        "complexity": question["complexity"]
    }

def all_data(questions):
    return [individual_data(question) for question in questions]
