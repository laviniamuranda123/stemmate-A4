from datetime import date, datetime


def validate_session(data):
    """Returns (cleaned, errors). errors is a dict of field -> message."""
    errors = {}
    cleaned = {}

    client_id = str(data.get("client_id", "")).strip()
    if not client_id or len(client_id) > 64:
        errors["client_id"] = "A valid client_id is required."
    cleaned["client_id"] = client_id

    code = str(data.get("facilitator_code", "")).strip()
    if not code:
        errors["facilitator_code"] = "Please choose a facilitator."
    cleaned["facilitator_code"] = code

    raw_date = str(data.get("session_date", "")).strip()
    try:
        d = datetime.strptime(raw_date, "%Y-%m-%d").date()
        if d > date.today():
            errors["session_date"] = "Date cannot be in the future."
    except ValueError:
        errors["session_date"] = "Use the date format YYYY-MM-DD."
    cleaned["session_date"] = raw_date

    topic = str(data.get("topic", "")).strip()
    if not topic:
        errors["topic"] = "Topic is required."
    elif len(topic) > 100:
        errors["topic"] = "Topic must be 100 characters or fewer."
    cleaned["topic"] = topic

    count = data.get("attendee_count")
    if isinstance(count, bool) or not isinstance(count, int):
        try:
            count = int(str(count).strip())
        except (ValueError, TypeError):
            count = None
    if count is None or count < 0 or count > 500:
        errors["attendee_count"] = "Enter a whole number from 0 to 500."
    cleaned["attendee_count"] = count

    notes = str(data.get("notes", "") or "").strip()
    if len(notes) > 500:
        errors["notes"] = "Notes must be 500 characters or fewer."
    cleaned["notes"] = notes

    return cleaned, errors