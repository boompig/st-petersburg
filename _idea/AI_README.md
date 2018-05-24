# How does the AI work?

The AI performs a simple BFS search on the current state of the board.
The state evaluation function attempts to maximize the number of points.
The BFS path becomes the AI's plan, and the AI performs the first action in that plan.

This is not optimal for multiple reasons:

1. It does not take into account the actions of other players
2. It does not do a good job of estimating what the next cards are likely to be
3. It does not learn from previous games or mistakes
