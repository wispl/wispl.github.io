+++
title = "Kubernetes Network Policy"
date = 2026-08-01
updated= 2026-08-01
+++

Network policies seem to be kind of varied, but not as "controversial" as setting resource limits. People either set them or don't. Depending on the nature of the setting, a "default deny" policy may be enforced. I like setting policies since it

1.  forces you to conceptualize how things fit together
2.  allows isolation from other pods in the namespace

The second one helps when you are forced to deploy everything in a single namespace. Anyways use <https://editor.networkpolicy.io/> to visualize and edit policies easier.
