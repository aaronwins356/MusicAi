# Choir of Objects - Usage Guide

## Quick Start

The Choir of Objects system allows you to create songs where inanimate objects sing with unique personalities.

### Basic Command Line Usage

```bash
# See the full system prompt for LLM integration
python3 choir_of_objects.py --system-prompt

# See an example song
python3 choir_of_objects.py --example

# See help
python3 choir_of_objects.py
```

### Python API Usage

#### 1. Import the Required Classes

```python
from choir_of_objects import ChoirOfObjects, ObjectPersonality, SongSection
```

#### 2. Create Object Personalities

```python
objects = [
    ObjectPersonality(
        name="Coffee Maker",
        personality="Enthusiastic morning optimist who bubbles with energy.",
        voice_description="Percolating soprano with rhythmic bubbling"
    ),
    ObjectPersonality(
        name="Alarm Clock",
        personality="Urgent but caring, speaks in staccato bursts.",
        voice_description="Sharp tenor with beeping undertones"
    )
]
```

#### 3. Define Song Sections

```python
sections = [
    SongSection(
        section_name="Verse 1",
        singer="Alarm Clock",
        lyrics=[
            "Wake up, wake up, the day is here!",
            "No time to lose, the dawn is near!"
        ]
    ),
    SongSection(
        section_name="Verse 2",
        singer="Coffee Maker",
        lyrics=[
            "Brew by brew, I warm your soul,",
            "Fill your cup to make you whole."
        ]
    ),
    SongSection(
        section_name="Chorus",
        singer="Coffee Maker + Alarm Clock",
        lyrics=[
            "Together we make mornings bright,",
            "One sound, one scent, one perfect light!"
        ]
    )
]
```

#### 4. Create and Display the Song

```python
choir = ChoirOfObjects()

song = choir.create_song(
    title="Dawn Duet",
    objects=objects,
    sections=sections,
    musical_style="Upbeat morning jazz with electronic clock beeps and percolation rhythms"
)

print(song)
```

## Output Format

The system produces songs in this structured format:

```
🎭 Title:
[Song title]

🎙️ Objects and Personalities:
[Object name]: [Personality description]

🎶 Song Structure:
[Section name] ([Singer])

🎵 Lyrics:
([Singer])
[Lyrics lines]

🎧 Musical Style & Arrangement Notes:
[Style description]

🗣️ Vocal Characterization Notes:
[Object name]: [Voice description]
```

## Tips for Creating Great Songs

1. **Object Selection**: Choose objects that naturally interact or contrast with each other
2. **Personality**: Base personalities on the object's function and nature
3. **Voice Description**: Match vocal qualities to the object's sounds or texture
4. **Lyrics**: Keep lines short and rhythmic, suitable for singing
5. **Musical Style**: Consider how the objects might sound together
6. **Emotional Arc**: Give your song a beginning, middle, and end

## Examples by Theme

### Kitchen Objects
- Kettle, Toaster, Fridge
- Coffee Maker, Alarm Clock
- Knife, Cutting Board, Spoon

### Living Room Objects
- Television, Bookshelf, Couch
- Lamp, Curtains, Remote Control
- Clock, Picture Frame, Rug

### Office Objects
- Computer, Desk Chair, Coffee Mug
- Stapler, Paper Clip, Notebook
- Mouse, Keyboard, Monitor

### Bathroom Objects
- Toothbrush, Mirror, Towel
- Showerhead, Soap, Bathtub
- Hairdryer, Comb, Faucet

## Integration with LLM Systems

To use this with an LLM (like ChatGPT, Claude, etc.):

1. Get the system prompt:
   ```python
   prompt = ChoirOfObjects.get_system_prompt()
   ```

2. Send it to your LLM as a system message

3. Ask the LLM to generate songs using the specified format

4. Use the Python API to programmatically create songs based on LLM output

## Testing

Run the test suite to verify everything works:

```bash
python3 test_choir_of_objects.py
```

All tests should pass with no errors.
