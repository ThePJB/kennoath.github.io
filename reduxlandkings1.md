# Reduxlandkings 1 - Motivation & Architecture

No gameplay stuff in this post, goes to show where my priorities are at. That will be the subject of the next post!

## Pure Rust and OpenGL
The main goal of this project is to free myself from the tyranny of C dependency management. Look, I think SDL is a really wonderful and simple library, but it makes it too hard for my friends to compile my stuff. Who knows, I might even be able to start devving on Windows...

Anyway I've managed to get some OpenGL working with this crate Glow, using Glutin as a backend or whatever. It wasn't too bad, it mostly mirrors the OpenGL calls you would make in C. There's not much about it online but yeah, once I brought myself to actually read the code it was fairly straightforward to get things working.

### One stupid mistake
There was only one thing that really tripped me up, which was of course really stupid: in `glBufferData` you have to pass it a `float*` for your data, right? Rust is not so happy with random casting so you have to go through some steps like convert it to a slice (which has a LENGTH) and then convert that to a pointer. Anyway I didnt multiply the slice length by the number of triangles , and interestingly it was only drawing the first triangle. So interesting I know lol.

## SDL style renderer
I love that SDL API (just draw me this rect please!) It requires almost no work to build that in OpenGL (granted I'm currently just drawing coloured squares but it would be pretty easy to add textures and UVs).

Basically every call to `renderer.draw_rect(r: Rect, colour: Vec3)` just chucks two triangles in a buffer, that gets sent to the gpu when you call `renderer.present()`, its super easy and I can't imagine it's tough on performance. I'm happy, computer is happy.

Its also really nice being fully float based and therefore resolution agnostic.

You can use a camera matrix in your shader, pretty convenient.

## Other nice things
'Winit' the windowing library - the main loop construct is pretty hectic for me, apparently it might take a closure for wasm compatibility, whatever. I got some weird errors trying to play with it, theres a lot of ownership + closure semantics I dont understand in Rust, whatever, I just left it in main.

But the nice thing is that its pretty airtight and seems to handle (/make you handle) all of the edge cases quite gracefully, so things like window resizing are handled for the first time in one of my games. Definitely a common thread with Rust for me. Maybe realtime audio would be tolerable to play with as well...

## Architecture

Layers:

 * 'Application' / main
   * OpenGL spaghetti lives here
   * Input decoded into `InputCommand`s
 * Game
   * Subjective - knows about the player
   * `InputCommand` to tell game things like play, pause, shoot, look, player wants to move
 * Level
   * Objective - its a simulation of a bunch of entities (player is not special here)
   * Player input comes in as `EntityCommand`s
   * AI also generates `EntityCommand`s. See, player is just another entity.

Remarks:
* Command pattern is so good. `InputCommand` easily mapped in a schema for keybindings
* Rust enums make command pattern so nice to do. Enums with fields are juicy.

## ECS???

nah just fat entities for now

## Collision System

I'm really fond of the solution I've come across for this one. Collisions are calculated and a buffer gets filled with `CollisionEvents`. A `CollisionEvent` is basically:
```
struct CollisionEvent {
    subject: u32,
    object: u32,
    penetration: Vec2,
}
```

Penetration encodes the amount and direction of the axis of least penetration. 

So the buffer is basically the rendezvous point for the entire system. There are multiple inputs: Entity - Entity collisions and Entity - Terrain collisions. Multiple other systems use the buffer:  

 * detecting bullet hits
 * not in this game but in a 2D platformer you detect if you need to stop falling from gravity
 * similarly but with killing your velocity if you touch something

Events can be filtered out if things shouldn't collide - e.g. a shooter with their own bullets

Finally, the appropriate amount of movement is calculated for each entity each frame (you stop moving early if you hit a wall obviously). All the information needed for this is in the penetration Vec2 and the subject field.

Its really easy to work with and really fast. Computer is happy and I am happy.


## Level Generation

Shamelessly copied the Nuclear Throne algorithm: walkers that carve space


## Closing thoughts
I really do think humans and computers can live together harmoniously. We want the same things a lot of the time.