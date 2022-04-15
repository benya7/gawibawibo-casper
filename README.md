# gawibawibo-casper


## Inspiration

The inspiration arose from the question what to build? keep it simple, fun and original!
Thinking... the idea of ​​the game Gawi, bawi, bo came up... as it is known in Korea. Or rock, paper or scissors as it is called in the West.
Reflecting on the structure of this game, I came to the conclusion that it is relative!

The option you choose is winning and losing at the same time, until the moment your opponent makes his move and they are compared.
There just takes a state of possible. Something like a quantum physics experiment!

The game is perfectly balanced, all move options have the same weight.

Gawi beats Bo and loses to Bawi,
Bawi beats Gawi and loses to Bo,
Bo beats Bawi and loses to Gawi.

This led me to develop this idea to present it in this hackathon..

## What it does

The game allows you to create a new move, choose a combination of three options and set your desired prize.
You can also take an existing move, sending your combination and the prize deposit chosen by the owner of the move.

When an opponent takes an existing move, the Play function is called, and it compares each option by hand.
The best of 3 hands wins and takes all the deposits in the move.

If the move is tied, it is canceled and the funds are refunded.
You can also view your move history and cancel an unplayed move.

## How we built it

The game is made up of a login system, you need a CASPER account to play.
Then we have two main panels, the first is to create a new move and set up a desired prize.
The second panel is the unplayed moves panel, here players can see their created moves or that of other players.
If it's your own move, you get the option to cancel the move, otherwise you get the option to take the move.
There appears another panel that allows you to choose your combination.

On the other hand we have the my moves history, where is the record of each move you created or played.

## Challenges we ran into

I faced two main challenges

The first one how to write the logic of the game to compare combination options at the same time and in a safe way.
After rewriting it 3 or 4 times, it was left in a clear and functional way, thus achieving the desired objective.

And the second and more difficult challenge was how to encrypt the data sent in the transaction, in order to prevent malicious people,
Guess the combination of a move, stealing the funds or winning by cheating.
After much thought, I was able to do it and I can say that the game is totally safe.
There is no way to second-guess a move and dishonestly take advantage.

To be honest, the way it is written is based on my experience with the CASPER and Rust libraries, what I learned during this hackathon.
I guess a more experienced CASPER coder can use a better approach or improve on this one.
Beyond that, as it is written now it is impossible to compromise by cheating or stealing funds, check it out!

## Accomplishments that we're proud of

- Have finished the minimum viable product for delivery.
- Being able to implement a solution to a game that I hadn't thought of before, within the limits of time.
- Have implemented a traditional game to the code and the NEAR block chain, in a simple and fun way!
- Grateful to God for the inspiration and intelligence to be able to face this challenge.

## What we learned

- Using the CASPER libraries, the first time for me writing on this network.
- The importance of encrypting the data sent in a transaction to ensure security.

## What's next for GawiBawiBo Game

- Implement a complete ranking of best players, most earned, most money earned, etc.
- Add NFT logic for prizes and rewards.
- Add NFT CEP-47 registration logic.
- Add a prize amount to deposit just the creation of a new movement, through a payable function.
- And any ideas that come up in the near future applicable to this beautiful traditional game.