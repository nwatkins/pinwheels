Pinwheels viewer
================

The Pinwheels viewer is a visualization tool for the relationships between skill trees (known as "pinwheels") in the role-playing system aptly named "Pinwheels". Each pinwheel contains 5 skills, each of which may be shared with an adjacent pinwheel. Skill trees are traversed by learning the interstitial skill, then spending points to "buy in" to the adjacant skill tree. Once a new skill tree is purchased, the other skills within are also learnable by the player.

Since there are many relationships between pinwheels, it was previously difficult to grok the shortest path from one pinwheel to any given other from merely reading the rulebook. This small application enables one to easily visualize the relationships of pinwheels and find the shortest path from one to another.

Prerequisites
=============
* Ruby 1.9.3p392
* Rails 3.2.12
* Postgres
* Git

Installation
============
1. In a terminal window, install the source code with `git clone https://github.com/nwatkins/pinwheels.git pinwheels` to clone the repository into a new directory named *pinwheels*
2. `cd pinwheels`
3. `bundle install` to install the necessary gems
4. `rake db:setup`, which will create the database and populate it with seed data
5. `bundle exec rails server thin` to start the server on the default port 3000
6. Navigate to http://0.0.0.0:3000 to hopefully see things working

*DISCLAIMER: This worked just fine on my Mac running OS 10.8.2. I can't guarantee that it'll be a cakewalk if installing on a PC*
