"""
Genera tutti i capitoli EN — Bari a Tavola
Voce: 8N2ng9i2uiUWqstgmWlH
Output: private/audio/bari/bari-tavola/_chapters/bari-tavola-capN-en.mp3
        r2_audio/bari-tavola/full-en.mp3  (dopo compressione manuale)
"""
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
API_KEY = os.getenv("ELEVENLABS_API_KEY")

VOICE_ID = "8N2ng9i2uiUWqstgmWlH"
OUTPUT_DIR = Path(__file__).parent.parent / "private" / "audio" / "bari" / "bari-tavola" / "_chapters"

VOICE_SETTINGS = {
    "stability": 0.35,
    "similarity_boost": 0.80,
    "style": 0.45,
    "use_speaker_boost": True,
}

CHAPTERS = {
    "bari-tavola-cap1-en.mp3": """My name is Rachele.

<break time="0.8s"/>

For this story, I'm not going to take you through a list of things to taste.

You can find a list anywhere.
Focaccia. Orecchiette. Panzerotti. Sgagliozze. Octopus. Mussels. Coffee.

The point isn't knowing the names.

<break time="0.5s"/>

The point is understanding why, in Bari, all these things seem to pour continuously out of doorways.
From the oven.
From the kitchen.
From the sea.
From the alleyways.
From a tray carried to the table.
From a paper bag passed hand to hand.

<break time="0.6s"/>

If you look toward the old city, the food is already inside the journey you're about to take.
It doesn't live only in restaurants.
It lives in the movement.
In the smell of an oven that catches up with you as you walk.
In the hands working pasta outside a home.
In the frying you smell before you see it.
In the sea that, in a city like this, never stays just scenery.

<break time="0.5s"/>

In Bari, something good rarely stays alone.

A piece of focaccia... gets broken and shared.

A panzerotto is waited for together.

A bowl of orecchiette comes from a hand that has repeated the same gesture thousands of times.

The fish is a reminder that this city has always looked toward the water — not just for beauty, but for work and for hunger.

And the coffee, in the end, doesn't close an elegant tasting.
More often it closes a conversation.
Or opens another one.

<break time="0.7s"/>

This guide starts here:
at the point where old Bari meets the city that strolls, stops for an aperitivo, lingers, moves on.

In front of you are restored piazzas, café tables, people arriving and people heading home.
Behind, in the alleyways, are gestures far older than the food-tour trend.

<break time="0.5s"/>

That doesn't mean everything has stayed the same.
Bari has changed.
Food has become image, tourist draw, livelihood, photograph to carry away.

But before becoming a photograph, it was — and still is — something simpler.

A way of making do.

A way of welcoming.

A way of never quite eating alone.

<break time="0.6s"/>

That's why the food of Bari can't be understood by choosing only the most famous dish.

You have to follow its path.

From the street, toward the sea.

From the sea, toward the homes.

From the homes, back outside...
where someone is frying, someone is kneading, someone is waiting for the focaccia to cool just enough to eat without burning themselves.

<break time="0.8s"/>

Start walking toward the sea.

To understand the food of Bari, you have to begin at the point where this city has always received what it needed to survive.""",

    "bari-tavola-cap2-en.mp3": """You need to stop here.

<break time="0.6s"/>

Because if I told you about the food of Bari without bringing you to N'dèrr'a la lanze, I'd only be telling you part of the story.

<break time="0.4s"/>

The name is Bari dialect.
It recalls the lanze — the small fishing boats — and the point where they were hauled ashore.
Not a tidy market behind a window display.
The opposite: a short, almost abrupt boundary between what came from the sea and those ready to take it away — or eat it right there.

<break time="0.5s"/>

This is the Molo San Nicola.

On one side the seafront, the Teatro Margherita, the city out for a walk.
On the other, the fishing boats, the wet hands, the buckets, the crates, the sea that isn't here for scenery — but to make a living.

<break time="0.6s"/>

In Bari, raw seafood wasn't born as a trend.
Before it became something visitors sought out, it was a habit rooted in a direct relationship with the catch:
mussels, cuttlefish, juvenile fish, sea urchins when they were available, and above all octopus.

<break time="0.4s"/>

The octopus, here, wasn't simply cleaned.

It was CURLED.

<break time="0.5s"/>

It was beaten against the stone.
Worked in the water.
Turned until the tentacles changed texture and coiled into tighter rings.

A long, physical, ancient gesture.
Not a preparation to photograph — a labour that needed hands, time, and sea.

<break time="0.5s"/>

Even today, when you see that gesture, you understand immediately that Bari food doesn't begin on the plate.

It begins earlier.

In the sound of octopus beaten against stone.

In the water that works it.

In the fisherman who knows when it's ready — without measuring.

<break time="0.7s"/>

And then comes the moment when the sea is eaten at almost no distance:
a piece of curled raw octopus, an open mussel, a cuttlefish — whatever the sea and the day have made available.

<break time="0.5s"/>

For many people from Bari, especially on festival mornings or Sundays, coming here meant — and can still mean — not just buying fish.
It meant stopping to eat a little on the spot.
Standing up. With a simple plate. Maybe a beer alongside.
In front of the water from which all that flavour seems to have just arrived.

<break time="0.6s"/>

You don't need to turn this place into a challenge.

Raw seafood always requires care: regular sourcing, proper storage, respect for the rules of the moment.

<break time="0.4s"/>

But even without tasting anything, you can understand the value of N'dèrr'a la lanze.

Here Bari shows a side that needs no staging:
a city that has never kept the sea at a distance.
It brings it close. Cleans it. Curls it. Opens it. Divides it. Eats it.

<break time="1.0s"/>

And when I think about this relationship with the sea...
the memory shifts further south.
Toward Savelletri.

Toward a place that for me and Domenico wasn't a restaurant.
And wasn't a destination to recommend in a guide either.

It was... Forcatella.

<break time="0.8s"/>

Today that area has restaurants and venues.
But I remember it as it was then:
shacks on the sea, fishermen in front of the water, and sea urchins taken from the water just offshore — brought to shore and opened right there.

<break time="0.5s"/>

I'm crazy about sea urchins.

<break time="0.4s"/>

Domenico and I would go there with crusty bread.
The urchin was opened, and you'd scoop that orange part directly with the bread.

Nothing else was needed.

The sea was in front of you... and in some way, it was also what you were eating.

<break time="0.6s"/>

We'd eat at least a hundred between the two of us.

<break time="0.5s"/>

Said today it sounds almost excessive.
But in that moment we didn't experience it as something to brag about.
It was our way of being there:
bread in our hands, sea ahead, time without rush and a flavour that resembled nothing else.

<break time="0.8s"/>

Today I know that memory belongs to another time.
Sea urchins are a fragile resource and should only be consumed when legally available and from verified sources.

But memories aren't corrected.
They're told honestly.

<break time="0.6s"/>

For me, the taste of the sea of this land remains that:
first Bari, with curled octopus at N'dèrr'a la lanze and raw seafood eaten facing the water...
then Forcatella, crusty bread between my fingers, Domenico beside me, and a sea urchin just opened on the shore.

<break time="1.0s"/>

Now walk slowly back toward the old city.

From the sea we move to the home.

Not a home separated from the street.
A Bari home that, to tell its food, brings the table almost to the doorstep.""",

    "bari-tavola-cap3-en.mp3": """You're now in one of the places many visitors come looking for specifically.

Here you may see outdoor tables, semolina flour, fresh pasta and quick hands shaping orecchiette.

<break time="0.5s"/>

The first thing to remember is simple:
you haven't walked into a set.

<break time="0.4s"/>

This street has become famous, photographed, sought out.
But behind the image is a domestic gesture:
water, semolina flour, the pressure of a knife, a thumb or finger that flips the pasta and gives it the shape that holds the sauce.

<break time="0.5s"/>

The orecchietta is small, but it's an intelligent shape.
No need for grand words to explain it.
Just look at it:
the rough side holds the sauce or the vegetables;
the hollow catches what would otherwise slide away.

<break time="0.5s"/>

When you meet it with turnip tops, the dish brings together two things immediately recognisable in Puglia:
the worked pasta and a vegetable with a strong, untamed flavour.
This isn't a cuisine that's afraid of bitterness.
It takes it and makes it part of the balance.

<break time="0.6s"/>

But here, in Bari, the strongest point isn't only the finished dish.

It's the fact that a preparation born in everyday life has arrived in front of the eyes of people from every corner of the world.

<break time="0.4s"/>

This change has two faces.

On one side there's pride:
a household gesture becomes known, sought after, purchased.

On the other, there's the risk of seeing people only as attraction:
the photograph of the woman making pasta, the short video, and then on to the next stop.

<break time="0.6s"/>

That's why I'm asking you one small thing.

If you find someone working pasta in front of their home, watch with respect.
Buy, if you want to take that product with you.
Ask before taking a close-up.
Remember that what lasts a few minutes for you is, for the person at that table, work, habit, presence in the neighbourhood.

<break time="0.7s"/>

In Bari the home and the street aren't always two separate worlds.

The orecchiette show this perfectly.

A table comes out the door.
A hand works.
Someone passes.
Someone stops.
The pasta takes shape — and at the same moment, the alleyway becomes kitchen, shop and meeting point.

<break time="0.6s"/>

This is the food that holds the city together.

Not because it has stayed identical for a hundred years.

But because it can still put one person in front of another:
the maker, the buyer, the one who asks, the one who listens, the one who discovers that small piece of pasta is not just an edible souvenir.

It's a gesture.

And gestures, when they survive, say far more than a recipe.

<break time="0.8s"/>

Now continue toward the small squares of the old town.

After the pasta that takes shape slowly, comes another piece of Bari:
the one of hot oil, the paper bag and the urge to eat right now.""",

    "bari-tavola-cap4-en.mp3": """There are foods that ask for a plate, a fork, a set table.

And then there are foods that seem made to leave the kitchen and find you in the street.

<break time="0.5s"/>

In Bari Vecchia, among the names that belong to street food, are sgagliozze and popizze.

<break time="0.4s"/>

Sgagliozze hold a surprise for anyone who arrives thinking of Puglia only through bread, tomato and pasta:
they're pieces of fried polenta.
Golden, hot, simple.
A food that doesn't seek elegance.
It seeks the right moment: the oil, the salt, the evening air, the paper bag that warms your fingers.

<break time="0.4s"/>

Popizze — small fritters of leavened dough — belong to the same world of immediate food:
the kind that doesn't need a long menu to make itself understood.

<break time="0.6s"/>

I won't tell you that you'll always find someone frying them just as you walk past.

A city isn't a backdrop that switches on at set times for the visitor.

<break time="0.5s"/>

But I want you to understand what they represent.

They're the side of Bari food that doesn't wait for an important occasion.
A pot of oil, a simple dough, people nearby:
that's enough to turn a corner of the old town into a place worth stopping.

<break time="0.6s"/>

There's a word often used to describe these preparations: poor.

It's a word that needs handling with care.

It doesn't mean they were romantic because they were born from little.
Necessity isn't decoration.
Cooking with basic ingredients also means having had to make a great deal from what was available.

<break time="0.5s"/>

But you shouldn't look down on them either, as foods left behind.

Sgagliozze and popizze show a very precise ability:
turning simple ingredients into a shared moment —
something that moves from kitchen to street and, in moving, creates connection.

<break time="0.6s"/>

As you walk, try to notice how much this city's food isn't afraid of being informal.

Sometimes you eat it standing up.

Sometimes with a napkin that's too small.

Sometimes with fingers still warm from the oil.

<break time="0.4s"/>

It's not carelessness.

It's the opposite of solemn waiting:
the pleasure of not having to delay what's good.

<break time="0.8s"/>

And if up to now we've followed food from the sea to the pasta and from the pasta to the fritters, there's still one scent that, for many people from Bari, barely needs announcing.

The one that comes from an oven.""",

    "bari-tavola-cap5-en.mp3": """Bari focaccia is probably the food many visitors encounter first.

And there's a reason:
it doesn't need to be explained before you want it.

<break time="0.5s"/>

You see it in the tray:
the surface marked by tomatoes, the oil, the soft dough, the edge that can turn crispier.
You smell it before you buy it.
Then you eat it and discover it can be at once simple... and impossible to forget.

<break time="0.6s"/>

Bari focaccia is recognised among the traditional agri-food products of Puglia.
But an official recognition, on its own, doesn't explain the relationship Bari has with it.

<break time="0.5s"/>

To understand that, you have to imagine not a special dinner —
but a piece grabbed while walking.
Paper that gets greasy.
A bite before the right hour.
Someone saying: shall we get a bit more?

<break time="0.6s"/>

The focaccia doesn't oblige anyone to sit down.

It asks for no complicated ritual.

It can accompany you as you enter the old city, as you leave, as you wait —
as you've already eaten but the smell from the oven convinces you another piece is still possible.

<break time="0.5s"/>

And it's here that it becomes truly Bari:
not only in its ingredients, but in its way of fitting inside the day.

<break time="0.6s"/>

Every bakery will have its own habits.
Some prefer it taller, some thinner.
Some look for the crispy corner, some want the softer centre.
Some argue about the potato in the dough, or the amount of tomato.

There's no single law to establish.

This too is part of the relationship with a loved food:
everyone recognises as perfect the version they feel closest to.

<break time="0.6s"/>

For someone arriving from outside, a focaccia can be simply something good to taste.

For Bari it's a daily presence.

It's one of those things that can be in a child's hand, in a bag carried home, in an impromptu stop, in a quick lunch, in a very simple memory.

<break time="0.5s"/>

I don't need to tell you it's "authentic".
That word, when it comes to food, gets used too easily.

You just need to see it in its natural place:
not isolated under a glass dome — but bought, broken, carried away, eaten while the city keeps moving.

<break time="0.7s"/>

And here you might think all of Bari is in that bite.

It isn't.

The focaccia is a doorway in.

But a city that lives between street, home and sea also has foods that require waiting.
Foods that burst when you open them.
Foods you can't eat too quickly — because the first bite might burn you.

The next one is like that.""",

    "bari-tavola-cap6-en.mp3": """The panzerotto has a closed shape.

<break time="0.5s"/>

And perhaps part of its appeal comes from exactly that:
until you open it, it holds everything in.

The dough. The filling. The heat.
The risk of biting too soon... and regretting it immediately.

<break time="0.6s"/>

In Bari the panzerotto belongs very much to the dimension of shared waiting.
Not only because it has to be made and fried —
but because it's often tied to moments of being together:
an evening out, a table of people, a simple choice made in company.

<break time="0.5s"/>

Tomato and mozzarella are the most recognisable filling.
But what matters in this story isn't making a list of variations.

It's understanding the difference between eating something and waiting for it together.

<break time="0.5s"/>

A focaccia can surprise you as you walk past.

A panzerotto, often, is a decision.
You order it. You wait for it to arrive. You know it'll be hot.
And in that wait there's already part of the evening.

<break time="0.6s"/>

Bari cooking has many foods that don't separate flavour from connection.

It doesn't only ask: do you like it?

It puts you in the position of sharing time before the dish even arrives.

<break time="0.5s"/>

This is a way of living that can seem small to a visitor.
But often it's precisely the small things that help you understand a city better than any monument.

<break time="0.4s"/>

People come to Bari and photograph the Basilica, the seafront, the city walls, the castle.

Then maybe they'll also remember a panzerotto eaten too hot...
while someone laughed because they'd made the same mistake.

<break time="0.5s"/>

Not because the panzerotto matters more than history.

Because the story of a place passes through what happens to you while you're inside it.

<break time="0.8s"/>

Now we need to move back ideally into the homes.

Because there's a dish that doesn't come mainly from the street, or from a quick taste.
It comes from the tray, from the layers, from the time in the oven —
and from that question that in every family can turn into an argument:
how is it really made?""",

    "bari-tavola-cap7-en.mp3": """There are dishes you eat.

And then there are dishes families argue about.

<break time="0.5s"/>

In Bari, the tray of potatoes, rice and mussels falls easily into the second category.

<break time="0.5s"/>

The ingredients are visible in the name itself: potatoes, rice, mussels.
Yet precisely because they seem simple, every detail can become important.
How the layers are arranged.
How much liquid is needed.
Whether and how much tomato.
The crust.
The cheese, when the family recipe includes it.
The exact point at which the rice is cooked — and has absorbed the flavour of the sea without losing its texture.

<break time="0.6s"/>

I don't want to turn an audio guide into a recipe tribunal.

The value of this dish also lies in the fact that it doesn't exist only as something to order.

It's a tray.

<break time="0.4s"/>

A form of cooking made to be carried to the table and shared.
A layered construction in which the sea, through the mussels, meets simple, earthly ingredients like potatoes and rice.

<break time="0.5s"/>

If the focaccia is the food that walks with you, this is the cooking that asks you to sit down.

Not because it's more noble.

Because it has a different function.

<break time="0.5s"/>

The tray speaks of home, of lunch, of enough for several people.
It speaks of the scent that arrives before it's time to serve.
It speaks of food not as a tasting — but as the centre of a table.

<break time="0.7s"/>

The scene is a tray being opened.

Someone taking the portion with the most crust.

Someone else checking whether the rice turned out right.

And, naturally, someone maintaining that at home they do it better.

<break time="0.5s"/>

There's no need to know which family is right.

What matters is understanding that when a dish provokes this kind of loyalty, it no longer belongs only to the kitchen.

It belongs to identity.

<break time="0.6s"/>

The sea, in this dish, doesn't arrive loudly.
It's not the immediate image of the stall or the boat.
It enters the layers, cooks with everything else, brings its flavour into a domestic preparation.

It's another face of Bari.

The one where what comes from the water doesn't stay separate from life at home.""",

    "bari-tavola-cap8-en.mp3": """Up to now we've moved through foods tied to ancient gestures:
handmade pasta, focaccia, fried food, the sea, the tray.

<break time="0.5s"/>

But a city can't stay alive if it only knows how to tell stories from the past.

<break time="0.4s"/>

Bari also has a more recent dish —
one that in just a few decades has become almost as recognisable as the traditional preparations:
spaghetti all'assassina.

<break time="0.5s"/>

The name sounds like it came from a joke or a provocation.
And in fact this dish has a character that doesn't seek discretion.

The spaghetti aren't simply boiled and sauced.
They cook in the pan, in direct contact with the sauce, until they reach that charred, crispy part that is the opposite of soft, reassuring pasta.

It's a red dish.
Spicy.
Direct.

<break time="0.6s"/>

Its story is generally placed in the Bari of the second half of the twentieth century;
local tradition links it to a restaurant in the city centre and to a birth that is relatively recent compared to the foods we've encountered before.

That's precisely what makes it interesting.

<break time="0.4s"/>

It proves that a city's cooking isn't only a museum of ancient recipes.
It can invent something new —
and within a generation, recognise itself in that taste.

<break time="0.5s"/>

L'assassina doesn't replace the orecchiette, the tray or the focaccia.

It stands beside them.
And tells of a different Bari:
urban, noisy, ironic, capable of turning a "wrong" pasta — stuck, charred, spicy — into a point of pride to argue about and seek out.

<break time="0.7s"/>

Bari knows how to defend its ancient rituals.

But it can also grow fond of a recent provocation — if that provocation has enough character to resemble it.

<break time="0.6s"/>

From the sea to the tray. From the table in the alleyway to the pan that burns.

Bari food doesn't have a single voice.

And that's exactly why it tells so well the story of a city that has never been only ancient, only religious, only maritime or only a tourist destination.

<break time="0.5s"/>

Bari changes.

And then, when it really likes something, it begins to say it was always part of itself.""",

    "bari-tavola-cap9-en.mp3": """We've almost returned to where we started.

<break time="0.5s"/>

In between there was the sea, the pasta worked in front of doorways, the hot oil, the oven, the wait for a panzerotto, a shared tray — and even a pasta that Bari decided to burn in order to make it its own.

<break time="0.7s"/>

One small gesture is missing.

A coffee.

<break time="0.5s"/>

Not because it's exclusively from Bari.
Coffee belongs to very many Italian cities, each with its own rhythms and habits.

But here too it can tell you something.

<break time="0.5s"/>

After everything you've seen, a coffee at the counter or sitting in the piazza isn't the obligatory finale of a food tour.
It's a simple way to stay in the city a moment longer.

<break time="0.8s"/>

I'm Rachele.
And I don't need to tell you that a recipe is only worth something if it's made the way my grandmother made it — or to invent a memory to convince you that Bari is real.

Bari doesn't need to be made more authentic by a constructed story.

It's already there in the gestures you've encountered.

<break time="0.5s"/>

In the sea arriving on shore.

In the pasta taking shape on a table outside a door.

In the focaccia that doesn't wait for lunchtime.

In the fried food eaten from a paper bag.

In the tray that everyone defends in their own way.

In the panzerotto that makes you wait.

In the new dish a city welcomes because it recognises its own character in it.

<break time="0.8s"/>

At the beginning I told you I wouldn't make a list of things to eat.

Now you know the list anyway.

<break time="0.5s"/>

But perhaps, if you taste something after this story, you'll do it differently.

You won't just think: it's good.

You'll think about where you are.

<break time="0.5s"/>

A city where food isn't locked inside restaurants and doesn't only serve to fill a day of travel.

Here food moves.

From the sea to the street.

From the street to the home.

From the home back outside, toward people.

<break time="0.7s"/>

That's why, in Bari, eating is never just eating.

It's one of the simplest ways the city has found not to be alone.""",
}


def generate_chapter(filename: str, text: str):
    out_path = OUTPUT_DIR / filename
    if out_path.exists():
        print(f"SKIP {filename} (gia' esistente)")
        return

    ssml = f"<speak>{text}</speak>"
    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        headers={"xi-api-key": API_KEY, "Content-Type": "application/json"},
        json={
            "text": ssml,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": VOICE_SETTINGS,
        },
    )

    if resp.status_code != 200:
        print(f"ERRORE {filename}: {resp.status_code} -- {resp.text}")
        return

    out_path.write_bytes(resp.content)
    size_kb = out_path.stat().st_size // 1024
    print(f"OK  {filename}  ({size_kb} KB)")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Voce: {VOICE_ID}")
    print(f"Output: {OUTPUT_DIR}")
    print("-" * 50)
    for filename, text in CHAPTERS.items():
        print(f"Genero {filename}...")
        generate_chapter(filename, text)
    print("-" * 50)
    print("Fatto.")


if __name__ == "__main__":
    main()
