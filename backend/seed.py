from app import db, app
from models import Chapter

long_text = """Chapter 1

It was a bright cold day in April, and the clocks were striking thirteen.
...
(the rest of the chapter)
"""

chapter = Chapter(title="Chapter 1", content=long_text)
with app.app_context():
    db.session.add(chapter)
    db.session.commit()

print("Chapter added.")
