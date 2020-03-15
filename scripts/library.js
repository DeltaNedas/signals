const signalOn = Color.valueOf("#b1cbf9");
const signalOff = Color.valueOf("#63728b");

function extendDef(T, def, merge, name) {
	Object.assign(def, merge || {});
	var ret;
	try {
		if (name === undefined) {
			ret = extend(T, def);
		} else {
			ret = extendContent(T, name, def);
		}
	} catch (e) {
		Log.err("[signals/library.js] Failed to extend {0} for {1}: {2}", T, name || "entity", e);
		throw e; // Print full stack trace
	}

	for (var i in def) {
		// Set values too
		if (typeof(def[i]) != "function") {
			ret[i] = def[i];
		}
	}
	return ret;
}

// Merge an array of objects into one
function features(arr) {
	const def = {};
	for (var i in arr || []) {
		Object.assign(def, arr[i]);
	}
	return def;
}

const signals = {
	extend(B, E, name, bFeatures, eFeatures) {
		const bDef = features(bFeatures);
		const eDef = features(eFeatures);
		return extendDef(B, {
			placed(tile) {
				this.super$placed(tile);
				// Fix for very very strange bug of tile.entity being null
				if (tile.entity == null) {
					tile.entity = this.newEntity().init(tile, this.synthetic());
				}
			},
			getSignal(tile) {
				return tile.entity.signals.signal;
			},
			setSignal(tile, signal) {
				tile.entity.signals.set(signal);
			},
			link(tile, other) {
				tile.entity.signals.link(other);
			},

			signalBar() {
				this.bars.add("signal", func((entity) => new Bar(
					prov(() => Core.bundle.get(entity.signals.signal ? "on" : "off")),
					prov(() => entity.signals.signal ? signalOn : signalOff),
					floatp(() => 1)
				)));
			},
			setBars() {
				this.super$setBars();
				this.signalBar();
			},

			entityType: prov(() => {
				const ret = extendDef(E, {
					read(stream) {
						this.signals.read(stream);
					},
					write(stream) {
						this.signals.write(stream);
					},

					getSignals() { return this._signals; },
					setSignals(set) { this._signals = set; },
					_signals: new JavaAdapter(BlockModule, signals.Module)
				}, eDef);
				ret._signals.readOnly = bDef.signalsReadOnly;
				return ret;
			})
		}, bDef, name);
	}
};

// Include types like SignalNode in signals export
Object.assign(signals, require("signals/types"));
module.exports = signals;