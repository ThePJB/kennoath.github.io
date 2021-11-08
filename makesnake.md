# Make Snake

This is the first game I made, its pretty easy. The hardest part is definitely setting up the dev environment (a trend that the astute among you will observe throughout your programming career)


## Technologies

* I'm going to recommend the library SDL2 which is about as easy as it gets for window creation, input handling, drawing (plus it can do sound and other stuff)
* I'm going to recommend doing it in C because C is pretty simple and easy, and if you are going to use SDL2 in other languages you need to do all the C setup *plus* the setup for the other language
* You are gonna want to use Linux because dependency management on Windows is hell
* For the editor I'm going to recommend VS code (get the deb or rpm off the website)

To install SDL2 its probably something like `sudo apt install sdl2` or `sudo dnf install sdl2` depending on your distro.



### C Quality of Life improvements

 * Compile with `-Wall -Werror`. C is stupidly loose without these flags. 
 * If you get a `Segmentation Fault` Compile with `-fsanitize=address`. This is a thing called Address Sanitizer. It might require a package or something to be installed. It catches memory errors. It makes your program print a stack trace when it segfaults so you can actually diagnose the problem
 * Install the vscode C/C++ plugin. Its really nice, it will catch errors for you in the editor and show you exactly where they are.

If you take all of these measures you may find that it is actually quite nice to work with C.


## How
We learn best by example. Below is a quick one that I cooked up.

You can also refer to [lazy foo sdl2 tutorial](https://lazyfoo.net/tutorials/SDL/) for a more thorough introduction.

If you want any more information refer to the [SDL wiki](https://wiki.libsdl.org/) on a function or type and it will have a good explanation for you.

Also just google for more examples or any more information, there is heaps of stuff out there regarding SDL2.

```C
#include <SDL2/SDL.h>   // hopefully your package manager put the SDL2 headers in the right spot
#include <stdio.h>

int main(int argc, char** argv) {
    int xres = 640;
    int yres = 480;

    // 1. first function you call to use SDL
    // it returns some value < 0 if it failed to initialize
    // this is how we check and handle the error
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        printf("failed to initialize sdl %s\n", SDL_GetError());
        return 1;
    };


    // 2. second function you call to use SDL
    // it returns a pointer to a 'window' struct which we later use to make a renderer
    SDL_Window* window = SDL_CreateWindow(
        "window title", 
        SDL_WINDOWPOS_UNDEFINED, 
        SDL_WINDOWPOS_UNDEFINED, 
        xres, 
        yres, 
        SDL_WINDOW_SHOWN
    );

    // the create window function returns a null pointer if it fails
    if (window == NULL) {
        printf("failed to create window %s\n", SDL_GetError());
        return 1;
    }

    // 3. make a renderer
    // this is used to draw things
    SDL_Renderer *renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);

    // handle failure similarly to above
    if (renderer == NULL) {
        printf("failed to create renderer %s\n", SDL_GetError());
        return 1;
    }

    // This is our setup code, for this very simple demo
    SDL_Rect bouncy_rect = {0, 0, 110, 70};
    int v_x = 7;
    int v_y = 3;

    SDL_Rect controlled_rect = {xres/2, yres/2, 50, 50};


    // This is the main loop
    // Each iteration of it is a frame in our game
    // The pattern of 1. handle input, 2. update state, 3. draw is typical
    while (1) { // one means true in C. This means loop forever

        // Handle input / events
        SDL_Event e;
        while (SDL_PollEvent(&e)) {
            // The SDL_Event type might seem kind of complicated but I promise its pretty
            // easy to dig through its fields to get the information you want
            // just follow examples or check out the wiki where it is explained clearly
            // https://wiki.libsdl.org/SDL_Event
            if (e.type == SDL_QUIT) {
                return 0;   // Remember returning from main quits the program
            } else if (e.type == SDL_KEYDOWN) {
                int v = 50;
                SDL_Keycode sym = e.key.keysym.sym;

                // WASD to move the white rect
                if (sym == SDLK_w) {
                    controlled_rect.y -= v;
                } else if (sym == SDLK_a) {
                    controlled_rect.x -= v;
                } else if (sym == SDLK_s) {
                    controlled_rect.y += v;
                } else if (sym == SDLK_d) {
                    controlled_rect.x += v;
                }
            }
        }


        // Update - this is our game logic
        bouncy_rect.x += v_x;
        bouncy_rect.y += v_y;
        if (bouncy_rect.x < 0 || bouncy_rect.x + bouncy_rect.w >= xres) {
            v_x = -v_x;
        } 
        if (bouncy_rect.y < 0 || bouncy_rect.y + bouncy_rect.h >= yres) {
            v_y = -v_y;
        } 


        // Draw - this is how we draw a frame of the game
        // Fill the screen with black
        SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
        SDL_RenderClear(renderer);

        // Draw a 100x100 red rectangle in the top left of the screen
        SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);
        SDL_Rect r = {0, 0, 100, 100};
        SDL_RenderFillRect(renderer, &r);

        // Draw the bouncy rect
        SDL_SetRenderDrawColor(renderer, 0, 0, 255, 255);
        SDL_RenderFillRect(renderer, &bouncy_rect);

        // Draw the controlled rect
        SDL_SetRenderDrawColor(renderer, 255, 255, 255, 255);
        SDL_RenderFillRect(renderer, &controlled_rect);

        // Don't forget this function call, this is what actually does the drawing. 
        // The other functions just wrote 'rect 0 0 100' to a buffer or whatever and
        // this one shoves it all on the GPU and tells it to draw it to the screen
        SDL_RenderPresent(renderer);

        // Impose a frame cap lest this run at 1000fps and the rectangle moves super fast
        // (comment out and see for yourself)
        // 1000ms / 16ms/frame = 62frames/second
        // framerate dependent behaviour can be seen in jank physics in some AAA games
        // its pretty easy to avoid but beyond the scope of this exposition
        // I'm ignoring the time it takes for this code to execute in this calculation
        // It matters in real games (thats why framerate drops)
        SDL_Delay(16);
    }
}
```

Ok well here's an exercise, make this into a game by having the player lose if the blue rect touches the white rect. (Hint 'separating axis theorem stack overflow')

Compile with `gcc main.c -o sdltest -Wall -Werror -LSDL2`

Run with `./sdltest` 

Workflow tip: combine it into one command i.e. `gcc main.c -o sdltest -Wall -Werror -LSDL2 && ./sdltest` to save time

Also FYI -LSDL2 means 'link' the SDL2 library. It also needs to be installed on your system in the right place, hopefully your package manager did that for you. Linking just means that some precompiled binary gets added to your program, basically. C dependency management is a bit antiquated but trust me it gets worse (unless you are using Rust or Go).

## But how do I turn this into snake?

This is the actual fun part! Now that all of the boilerplate is working and you can handle input and draw rectangles the world is your oyster. Here's a high level overview of how I would approach making snake:

* Snake can be implemented on a grid of tiles (2d array)
  * A 2d array can be implemented as a 1d array where you access `(x, y)` with `i = x*width + y`
  * you should be able to figure out how to get neighbours of a tile then
  * remember to check bounds (or your program will probably segfault, or even worse, start accessing random memory), in snake going out of bounds usually means you die
* Tiles you want are probably TILE_HEAD, TILE_BODY, TILE_EMPTY, TILE_FOOD
  * these are best represented as an enum (stands for enumeration) which is a fancy number where the numbers have names (google C enum)
  * i.e. `if (tiles[x*w + y] == TILE_FOOD)` rather than `if (tiles[x*w + y] == 3)` reads better and you will make less mistakes
* So the game state is just the grid of tiles, plus you probably need the direction the player last pressed and maybe a score or something
  * in the update section you just need to update the state appropriately to get snake behaviour
  * probably make the frame rate slower or it will move too quick
* Figure out how to draw your game state for the draw section
  * calculate the position of each tile in your grid, set colour based on its type, then draw it

GLHF

## Final Thoughts
 * Games are hard, start very very slow and simple. Tile based = good
 * Try to read your errors and understand them, it will help you debug
 * Try to do the simplest thing first, if your solution starts getting complicated think about if the complication is actually necessary
 * Try to understand all of your program's behaviour. When you don't know why it doesn't really do what you expect but you hack around it or ignore it you are just asking for trouble
 * Try to do a good job, be neat etc. Crap code is the real root cause of a lot of problems. Take the time to tidy things up, it will save you time overall.