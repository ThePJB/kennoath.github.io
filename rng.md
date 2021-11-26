# Testing RNGs

I'm curious to do my own research into how RNGs perform in terms of performance and randomness (and also how much I can trade off randomness for performance since it ends up being the hottest function in voxel game terrain generation), as well as to finally dispel the lurking doubts over whether what I'm using is actually random.


I've been using this hash function stolen from [this talk](https://www.youtube.com/watch?v=LWFzPP8ZbdU)
```Rust
fn squirrel(seed: u32) -> u32 {
    let n1 = 0xB5297A4D;
    let n2 = 0x68E31DA4;
    let n3 = 0x1B56C4E9;
    let mut mangled = seed;
    mangled *= n1;
    mangled ^= (mangled >> 8);
    mangled += n2;
    mangled ^= (mangled << 8);
    mangled *= n3;
    mangled ^= (mangled >> 8);
    return mangled;
}
```

which turns into an RNG as such
```Rust
fn squirrel_ab(seed: &mut u32, lower: u32, upper: u32) -> u32 {
    let hash = squirrel(*seed);
    *seed = hash;
    squirrel(hash) % (upper - lower) + lower
}
```


# Chi Squared

ok I'm 





curious about SIMD / optimizing hard some noise