+++
title = "Recovery Charges"
date = 2026-07-04
updated= 2026-07-11
+++

## Introduction {#introduction}

The recovery charges substitute for the ejection charges now so they should do the same job: separating the parts of the rocket. You need have just enough for separation and not destruction.

You can test charges on the ground by propping your rocket horizontally on some stand and just trying the ejections to see if they separate. Note that the bay and computers do not need to be installed for the test, though you can include them if you want. Be careful when testing and stand far enough away.

The ejection charges are generally FFFFg black powder. See [Black Powder Scales](@/notes/20260705002723-black_powder_scales.md) for what the letters mean. Long story short, more Fs means the powder is "finer". The finer powder burns faster due to a smaller surface area, which we want; the ejection should be as quick as possible to avoid gases from seeping into the other parts of the rocket.

Always perform a recovery charge ground test. And always perform one when your system changes, especially when the volume in the parachute bay changes.


## Table {#table}

Row is the length of parachute bay, and the far left column is the inside diameter of the body tube.

|      | 6    | 9    | 12   | 15   | 18   | 21   |
|------|------|------|------|------|------|------|
| 1.53 | 0.09 | 0.13 | 0.17 | 0.21 | 0.26 | 0.30 |
| 2.15 | 0.17 | 0.25 | 0.34 | 0.42 | 0.51 | 0.59 |
| 2.56 | 0.24 | 0.36 | 0.48 | 0.60 | 0.72 | 0.84 |
| 3.00 | 0.33 | 0.49 | 0.66 | 0.82 | 0.98 | 1.15 |
| 3.90 | 0.55 | 0.83 | 1.11 | 1.39 | 1.66 | 1.94 |
| 5.38 | 1.05 | 1.58 | 2.11 | 2.64 | 3.16 | 3.69 |
| 6.00 | 1.08 | 1.62 | 2.17 | 2.71 | 3.25 | 3.79 |
| 7.51 | 1.08 | 1.62 | 2.17 | 2.71 | 3.25 | 3.79 |

The assumption is 15 psi for body tubes with diameters smaller than 5.5" and 350 lb of separation force for larger values. This is of course going to be a little inaccurate compared to the actual calculations.

But since you should always test charges, using the table is not a bad idea.


## Math and Physics {#math-and-physics}

We can grab the force needed by using the ideal gas law, \\(PV = nRT\\). Recall that \\(F = PA\\). We can estimate the volume as \\(V = \pi l r^2\\) rather than using the exact volume. The \\(l\\) is the approximate length of the parachute bay.

For black power, the constants are \\(R = \qty{266}{in}\\) and \\(T = 3307\\) (in Rankines). The density of the powder is generally around \\(\qty{453.59}{g/lb}\\).

Generally, the ejection charge should be around \\(P = \qty{15}{psi}\\) for a body tube of 2" to 5 1/2". Any longer than that, you need to reduce the pressure or keep the force at around \qty{350}{lb}.

You can then manipulate the equation and solve for the mass, which is a good estimate of how much powder you need. You can then increase or decrease the amount by 25% each time if you are not satisfied. See
