# Signals for Mindustry

Signals acts as a library and a standalone mod.

The Signal system is similar to power, however it can only be on or off.
Additionally, current is unidirectional.

Other mods can use it to create signal-dependent blocks or signal outputting blocks.

On its own, Signals adds:
- Signal nodes
- Lamp
- Switch
- Button

# TODO
- Fix laser direction
- Fix nodes linking to themselves
- Actually unlink nodes
- Per-block node link limit
- Fix spooky lamp crash

# For mod developers

`T extend(T extends Block, E extends TileEntity, String name, Object[] bFeatures, Object[] eFeatures = [])` - add signal functionality to a new block.
`boolean getSignal(Tile tile)` - return the signal received for a tile.
`void setSignal(Tile tile, boolean set)` - set the signal outputted by a tile.

tile.entity will contain `SignalModule signals`.
You can set `signalsReadOnly` in your Block def to disable writing to its signal value.

To use Signals:
- Add it as a dependency in your mod.h/json
- Do not set signals in clientside code like in `draw`, `drawLayer`, etc.
- See example code below


```js
// Import signals library
const signals = require("signals/library");

// Create a signal input
const poweredRouter = signals.extend(Router, Router.RouterEntity, "powered-router", [{
	update(tile) {
		if (this.getSignal(tile)) {
			this.super$update(tile);
		}
	}
}]);

// Create a signal output
const signalConveyor = signals.extend(Conveyor, Conveyor.ConveyorEntity, "signal-conveyor", [{
	update(tile) {
		this.super$update(tile);
		// Output a signal only if the conveyor has items
		this.setSignal(tile, tile.ent().items.total() > 0);
	},
	signalReadOnly: true
}]);
```

## Extra types

Types are defined in `types.js` and are available by requiring that or `library.js`.

Add them to the `features` array in `signals.extend`.
