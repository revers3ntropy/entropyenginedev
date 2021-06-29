# Game engine for the HTML canvas

To get the engine, download the files directly from Github 
and put them into your project.

(Or if you want to use the latest 
experimental version, reference `https://revers3nropy.com/ess/entropy-engine-jc/` 
when importing the engine, and use absolute paths to everything (Not recommended)).

## Boilerplate:
.html file:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>title</title>

    <script src="./path/to/entropy/engine/index.js" type="module"></script>

    <script src="index.js" type="module"></script>
</head>

<body>
    <canvas id="myCanvas"></canvas>
</body>
</html>
```

index.js file:
```js
import { runFromJSON } from "./path/to/entropy/engine/entropy-engine-jc";
runFromJSON('./path/from/entropy/engine/index.json');
```

index.json file:
```json
{
  "canvasID": "myCanvas",
  "entities": [
    {
      "name": "main camera",
      "components": [
        {"type": "Camera"}
      ]
    }
  ]
}
```

***
# JSON properties
The imported JSON file can have the following properties:
```json
{
  "canvasID": "myCanvas",
  "width": 1000,
  "height": 500,
  "performanceDebug": 0,
  "entities": []
}
```
Where:
- canvasID is the id of the canvas set in the HTML file
- width is the desired width
- height is the desired height
- performanceDebug is if you want a breakdown of how long various things take to run. 
  1 gives you just total Update time, 2 givers you more detail.
- entities is a list of all entity objects (see below)


***
# Maths
## Vector 2
### class: `v2`

instance properties: (get by saying `instance.property`)
```ts
// addition
let add: (v: v2) => v2

// subtraction
let sub: (v: v2) => v2

// multiplies x by x and y by y
let mul: (v: v2) => v2

// divides x by x and y by y
let div: (v: v2) => v2

// multiplies x and y by k
let scaleBy: (k: number) => v2

// finds the distance between two points
let distTo: (v: v2) => number

// returns the absolute difference between the two vectors
let diff: (v: v2) => v2

// returns the magnitude of the vector
let magnitude: number

// sets the vector to a vector of the same direction with a magnitude of 1
let normalise: () => v2

// returns a new vector with the same x and y as the instance
let clone: v2

// returns the vector in the form:
//  x: 0 (\n)
//  y: 0
let str: string

// returns true if the point is within the bounds of the rectangles defined in the paramters
let isInRect: (rectPos: v2, rectDimensions: v2) => boolean

// sets this vector x and y to the passed vectors
let set: (to: v2) => v2

// lots of these functions change the vector and return it, allowing for things like this:
let dist = new v2(1, 1)
    .add(position1)
    .scaleBy(size)
    .distTo(
        position2.clone
            .scaleBy(size/2)
            .add(new v2(1, 1))
            .normalise()
    )
```

Static methods: (called by saying `v2.function(args)`)
```ts
// returns the vector [0, 0]
let zero: v2

// returns the vector [0, 1]
let up: v2;

// returns the vector [0, -1]
let down: v2;

// returns the vector [1, 0]
let right: v2;

// returns the vector [-1, 0]
let left: v2;

// averages the x and y values and returns them in a vector
let avPoint: (points: v2[]) => v2
```

## Triangle
### class: `Triangle`
Not used so much for 2D graphics, but may be useful in some circumstances. 

Holds three `v2` points.

Has only one method, `move` which will translate all points in teh triangle by the `v2` passed in.

## Mesh
### class: `Mesh`
Not used so much for 2D graphics again.

Holds an array of `Triangle`s.

Has only one method, `move` which will translate all points in all of its
triangles triangle by the `v2` passed in.

***

# Sprites
Sprites are the most basic thing in your game.
They can be created in the javascript or in the .json file.

To create one in JS, use `Entity.newSprite({ })`. 
Pass arguments using standard JS object syntax:

```js
Entity.newSprite({
	name: 'player'
});
```

To create in the json, simply add a new object to the `"entities"` field like so:

```json
{
  "name":  "player"
}
```

They do the same thing.

### Sprites take through these arguments:

- `name: string` gives the entity a name

- `tag: string` gives the entity a tag. Tags can be used for lots of entities.

- `scaleBy: v2`  scales the entity and all of its components on initialisation 
    (to define a 2D vector in the JSON use `[number, number]`, and in js use `new v2(number, number)`)

- `components: array` a list of all components the entity should use. See 'Components' for more.

- `Static: boolean` if the entity should move or not. When set to false, 
  only scripting can move the entity
  
- `transform: Transform` All entities have to have a transform. See more about Transforms below.


## Entity class
The entity class has many useful Static and instance methods. 
### Instance methods:

```ts
// adds a component to the entity
let addComponent: (component: Component) => void
    
//Checks if the component exists on the entity or not
let hasComponent: (type: string, subtype: string) => boolean

// returns the first component if it exists, throws an error if it doesn't
let getComponent: (type: string, subtype: string) => Component

// returns an array of all component with matching type
let getComponents: (type: string, subtype: string) => Component[]

// scales all components of the entity
let scaleBy: (factor: v2) => void

// deletes the entities and stop any components from functioning
let delete: () => void
```

### Static methods:
```ts
// creates a new entity and returns it. 
// Note that SpriteConfig is an object which takes the arguments defined above in
let newSprite: (setup: SpriteConfig) => Entity

// fills and area with circles
// each circle automatically has these components:
//  Body
//  CircleCollider
//  CircleRenderer
let fill: ({
    // top right corner
    position: v2,
    // size of area to be filled
    dimensions: v2,
    // the radius of each circle created
    particleRadius: number,
    // this is applied to each particle
    material: PhysicsMaterial,
    // applied to every entity
    gravityAttract: v2,
    // applied to every entity
    gravityEffect: number,
    // each entity is called 'name x y'
    name: string,
    // applied to the CircleRenderer of each entity
    colour: string,
    // the Static property on all entities
    Static: boolean
}) => Entity[]

// returns the first entity with the name passed in
let find: (name: string) => Entity | undefined

// returns all entities with specified tag
let findWithTag: (tag: string) => Entity[] | []

// calls the handler for each entity, passing it in
let loopThroughSprites: (handler: (entity: Entity) => void) => void
```
***
# Components
Components are added to Entity instances and hold almost all functionality for the entity.
Components are defined in the JSON `"components"` attribute of a entity. 
The component only requires the `"type"` attribute, but other specific to the type can be used.
Most entities have to have a `Body` component to function;
for example `Renderer` and `Collider` components need to know where the entity is to operate.

Every component has a `scaleBy` function built in, which takes in a `v2`. 
Where only one number is required, just the x value will be used. 
However, the y value can still have an effect, so when doing this default the y value to 1 rather than 0.
This is called on every component in the entity when `scaleBy` is called on the entity.

Every component also has the following properties:
```ts
// the primary type (eg. 'Collider' or 'Body')
type: string
// the secondary type (eg. 'RectCollider' or 'ImageRenderer)
subtype: string
// some components have only a type
hasSubType: boolean
```
For `Script` components, the subtype is the name of the script (e.g. `'playerController'`')

Component constructors take in an object and will look at properties the same as their own.
## Transform
Most basic component that every entity has to have.
Constructor takes an object with the following properties:
```ts
position: v2 // default (0, 0)
scale: v2 // default (1, 1)
rotation: number // default 0
parent: Transform // not needed if you want it to be a root
```

###Properties
`*` setting sets local position, getting gets world position

| property            | description
|---                  |---
| position            | *  |
| localPosition       | the position relative to direct parent
| rotation            |  *
| localRotation       | the rotation relative to direct parent     
| scale               | *
| localScale          | scale relative to direct parent
| entity              | the entity this Transform is attached to
| root                | the root parent of this transform - returns itself if it is root
| forwards            | a unit v2 in the direction this is pointing in in world space
| right               | a unit vector 90 degrees clockwise from forwards

| Methods             |  Arguments   | description
|---                  |---           |---
| detachParent        |              | makes this Transform a root
| detachChildren      |              | makes all direct children roots
| getChildren         |              | returns an array of all child Transform's Sprites
| getChildCount       |              | returns the number of direct children this has
| makeChildOf         | t: Transform | sets this parent to passed transform
| makeChildOfFromName | name: string | sets this parent to transform associated with first Entity with passed name
| makeParentOf        | transforms: Transform[] | sets parent of all passed Transforms to this
| isRoot              |              | true is this.parent is undefined
| isChild             |              | true is this.parent is not undefined
| getChild            | name: string | gets a child whose entity's name matches passed

No static methods

## Body component
Constructor takes an object with the following properties:
```ts
// not yet implemented
mass: number
// in which direction should the object move due to gravity
gravityAttract: v2
gravityEffect: number
zLayer: number
// when froxen, it is not updated, but can still be changed from script
frozen: boolean
material: PhysicsMaterial
```

### Properties

| property            | description
|---                  |---
| velocity            | speed and direction in the form of a v2  |
| mass                | affects things like collisions and in some cases gravity
| gravityAttract      | which direction it should do gravity to. THe greater the magnitude of the vector, the stronger the gravity
| material            | a physics material (see below)

| Methods             |  Arguments   | description
|---                  |---           |---
| applyForce          | force: v2    | pushes the object based off the vector passed and mass

No static methods

### Physics Materials
An object containing the following properties:
```ts
friction: number // 0-1
airResistance: number // 0-1
bounciness: number // 0-1
```

all in the range of 0 to 1

## Renderer Components
These components allow the entity to be drawn to the screen, 
and are dependent on the main camera, the entities `Body` component and this component's offset.

### Properties

| property            | description
|---                  |---
| dimensions          | either width and height or radius, specific to subtype  |
| offset              | offsets the renderer from the transform
| zLayer              | layer of the components, determines what renders on top of what

No methods

### RectRenderer
Constructor takes an object with the following properties:
```ts
height: number
width: number
offset: v2
colour: string
```

### CircleRenderer
Constructor takes an object with the following properties:
```ts
radius: number
offset: v2
colour: string
```

### ImageRenderer
Constructor takes an object with the following properties:
```ts
height: number
width: number
// path from entropy engine
url: string
offset: v2
```

## Collider Components
These components allow two objects to detect and resolve collisions dynamically and statically
(i.e. the entities are moved away from each other, and they bounce off of each other)

Every collider has a `overlapsPoint` function, which takes in a point (`v2`)

### Properties

| property            | description
|---                  |---
| dimensions          | either width and height or radius, specific to subtype  |
| offset              | offsets the renderer from the transform
| solid               | if set to false, then it doesn't update or collide with anything

| Methods             |  Arguments   | description
|---                  |---           |---
| overlapsPoint       | transform: Transform, p: v2    | returns whether or not the point collides with the collider given the transform

No static methods

### RectCollider
Constructor takes an object with the following properties:
```ts
width: number
height: number
solid: boolean
offset: v2
```

### CircleCollider
Constructor takes an object with the following properties:
```ts
radius: number
solid: boolean
offset: v2
```

## Script Component
It takes in an object with the following properties:

```ts
// the only thing passed into any component which is required. 
// Instance of a class which inherits from JSBehaviour
script: JSBehaviour
// when set to true, whenever a magic method is called on the script, 
// it is timed and the result is console.logged
profile: boolean
```

| property            | description
|---                  |---
| profile             | whether or not to profile the scripts  |

| Methods             |  Arguments   | description
|---                  |---           |---
| runMethod           | name: string, args: any[] | Tries to run the method on the script. Will be profiled like magic methods.

No static methods

When initialising in JSON, it also takes a `path` 
property which is the path to the JS file which contains the class.
Optionally, if the classname is different from the name of the file that the class 
is contained in, a `className` property can be added as well.

## Camera Component
Cameras are how things are viewed. Camera components can be added to any entity. 
Only one camera is used at a time, which is stored in the Static property `Camera.main` on the Camera component class.
This entity must have a Camera Component attached to it. 
The first entity with a camera component is made the main on initialisation, 
but can be changed under a `Start` method if you want it be a different camera.

The camera component takes in an object with the following properties:
```ts
zoom: number
```

| property            | description
|---                  |---
| zoom                | how zoomed the field of view is  |
| [static] main       | the entity with the Camera component currently in use  |

| Static Methods     |  Arguments   | description
|---              |---           |---
| shake           | amount: number, durationMS: number | shakes the main camera round by changing its position and zoom slightly for specified amount of time (in ms)


On this component, the `scaleBy` method will change the zoom by the value passed in as the `x`.
To reset the main camera, call `Camera.findMain()`.

***

# Scripting API

Almost everything mentioned above can be used when scripting, for example accessing a entity's body's x-coordinate would be through:

```js
Entity.find('name').getComponent('Body').velocity.x
```

## Magic Methods

There are many methods that are automatically called in a script. 
You just need to define them, and they will get run.

### `Start`
this method will automatically get run once the engine has initialised,
so is the first place you will be able to use `this` (as shown below).

### `Update`
This is called every single frame

### `onCollision`
This is called if the entity this script is attached to has a `Collider` component, 
when that collider collides with anything. The entity it collides with is passed in.

### `onClick`
If the entity that this is attached to has a `GUIElement` component as well, 
then this will get called whenever the GUI component is clicked on by the user

## Input
To access input, simply use `import { input } from './path/to/ee`
You now have access to the `input` object, which contains lots of info on user-input.
For example, for find if the user has the 'W' key held down, use `if (input[input.W])`
It uses the keys keycode, so `input.W = 87`.

'Weird' predefined keys:
```ts
input.Space
input.Enter
input.Shift
input.Backspace

// Might map weirdly between mac and windows, not entirely sure...
input.Ctrl
input.Alt
// Mac-only: command left and right
input.CmdR
input.CmdL
// Windows-only
input.WindowsKey

// arrow keys
input.Left
input.Right
input.Up
input.Down
```

`input` also has `mouseDown` and `cursorPosition` attributes,which are pretty self-explanatory.

## this
Some properties are added to `this` on construction:

| property   | description
|---         |---
| name       |  the name of the entity the script is attached to
| entity     | the entity the script is attached to
| transform  | the transform attached to `this.entity`


## Tips

- Try not to use any 'getting' functions during the `Update` method, as with lots of entities they can 
  get very inefficient. Rather, keep as instance of what you need to access on `this` and 
  define it in the `Start` method.
  
- Rather than setting a width and height for every component, set the `scaleBy` attribute on the entity and 
  everything will get scaled automatically.
  
- It may not be practical for lots of small scripts, but try to give each script its own file, 
  and name the file the same thing as the script. It makes everything feel cleaner, 
  and means you don't have to define a `className` property in the JSON.
  
- Make sure to use a clone of vectors if you don't want to change them when using them 
  (e.g. `vA.clone.add(vB)` rather than `vA.add(vB)`)

***

# Example Game: Pong

This is a very simple Pong game:

![pong example](https://revers3ntropy.com/ess/entropy-engine-jc/README-pong.png)
[*(play here!)*](https://revers3ntropy.com/ess/ee-test-pong/)

index.js:
```js
import { runFromJSON } from "./path/to/entropy/engine/entropy-engine-jc";
runFromJSON('./path/from/entropy/engine/entities.json');
```

index.html:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title> Entropy Engine Pong </title>

    <meta name="viewport" content="width=device-width, initial-scaleBy=1">

    <script src="../entropy-engine-jc/index.js" type="module"></script>
    <script src="index.js" type="module"></script>
</head>

<body>
    <canvas id="myCanvas"></canvas>
</body>
</html>
```

playerController.js:
```js
import { JSBehaviour, input, v2 } from "../entropy-engine-jc";

export class playerController extends JSBehaviour {
  constructor () {
    super();
  }

  Start () {
    this.speed = 5;
    this.isP1 = this.name === 'player 1';
  }

  Update () {
    if (input[this.isP1 ? input.W : input.Up]){
      this.transform.position.y += this.speed;
      
      if (this.transform.position.y > 150)
        this.transform.position.y = 150;
    }


    if (input[this.isP1 ? input.S : input.Down]) {
      this.transform.position.y -= this.speed;
      
      if (this.transform.position.y < -250)
        this.transform.position.y = -250;
    }

  }
}
```

ballController.js:
```js
import { JSBehaviour, v2, Entity } from "../entropy-engine-jc";

export class ballController extends JSBehaviour {
  constructor(){super()}

  Start () {
    this.speedX = 10;
    this.bounceRandomMod = 3;

    this.body = this.entity.getComponent('Body');

    this.body.velocity= v2.right.scale(this.speedX);
  }

  Update () {}

  onCollision (entity) {
    switch (entity.name) {
      case 'player 1':
      case 'player 2':
        this.body.velocity.x *= -1;
        this.body.velocity.y += (Math.random() - 0.5) * this.bounceRandomMod
        break;

      case 'top':
      case 'bottom':
        // bounce
        this.body.velocity.y *= -1;
        break;

      case 'left':
      case 'right':
        // has gone past a bat
        this.restart(entity.name);
        break;
    }
  }

  restart (loser) {
    this.transform.position = v2.zero;
    this.body.velocity = v2.right.scale(this.speedX);

    // increment one of the `GUIText`s by 1
    let score = Entity.find(`${loser === 'left' ? 'player 1' : 'player 2'} opponent-points`).getComponent('GUIElement');
    score.text = (parseInt(score.text) + 1).toString()
  }
}
```

And finally, the *very* long index.json:
```json
{
  "canvasID": "myCanvas",
  "width": 1000,
  "height": 500,
  "entities": [
    {
      "name": "main camera",
      "components": [
        {"type": "Camera"}
      ]
    },
    {
      "name": "player 1",
      "transform": {
        "position": [-430, -50],
        "scale": [30, 100]
      },
      "Static": true,
      "components": [
        {
          "type": "RectRenderer",
          "colour": "rgba(0, 0 , 0, 0.6)"
        },
        {
          "type": "Script",
          "path": "../ee-test-pong/playerController.js"
        },
        {"type": "RectCollider"}
      ]
    },
    {
      "name": "player 2",
      "transform": {
        "position": [400, -50],
        "scale": [30, 100]
      },
      "Static": true,
      "components": [
        {
          "type": "RectRenderer",
          "colour": "rgba(0, 0 , 0, 0.5)"
        },
        {
          "type": "Script",
          "path": "../ee-test-pong/playerController.js"
        },
        {"type": "RectCollider"}
      ]
    },
    {
      "name": "ball",
      "transform": {
        "scale": [20, 1]
      },
      "components": [
        {"type": "CircleRenderer"},
        {"type": "CircleCollider"},
        {
          "type": "Body",
          "velocity": [10, 0],
          "material": {
            "airResistance": 0
          }
        },
        {
          "type": "Script",
          "path": "../ee-test-pong/ballController.js"
        }
      ]
    },
    {
      "name": "player 1 opponent-points",
      "transform": {
        "position": [800, 350]
      },
      "components": [
        {
          "type": "GUIText",
          "text": "0",
          "fontSize": 75
        }
      ]
    },

    {
      "name": "player 2 opponent-points",
      "transform": {
        "position": [200, 350]
      },
      "components": [
        {
          "type": "GUIText",
          "text": "0",
          "fontSize": 75
        }
      ]
    },
    {
      "name": "top",
      "transform": {
        "scale": [1000, 100],
        "position": [-500, 250]
      },
      "Static": true,
      "components": [
        {"type": "RectCollider"}
      ]
    },
    {
      "name": "bottom",
      "transform": {
        "scale": [1000, 100],
        "position": [-500, -350]
      },
      "Static": true,
      "components": [
        {"type": "RectCollider"}
      ]
    },

    {
      "name": "left",
      "transform": {
        "scale": [100, 500],
        "position": [-531, -250]
      },
      "Static": true,
      "components": [
        {"type": "RectCollider"}
      ]
    },
    {
      "name": "right",
      "transform": {
        "scale": [100, 500],
        "position": [431, -250]
      },
      "Static": true,
      "components": [
        {"type": "RectCollider"}
      ]
    }
  ]
}
```
