const signalOn = Color.valueOf("#b1cbf9");
const signalOff = Color.valueOf("#63728b");
const intc2 = method => new Intc2(){get: method}

module.exports = {
	Node: {
		load() {
			this.super$load();
			this.laser = Core.atlas.find("signals-laser");
			this.laserEnd = Core.atlas.find("signals-laser-end");
			this.onRegion = Core.atlas.find(this.name + "-on");
			// Only used on client so it's okay
			this.t1 = new Vec2();
			this.t2 = new Vec2();
		},

		drawSelect(tile) {
			this.super$drawSelect(tile);

			Lines.stroke(1);

			Draw.color(signalOn);
			Drawf.circles(tile.drawx(), tile.drawy(), this.laserRange * this.tilesize);
			Draw.reset();
		},
		drawPlace(x, y, rotation, valid) {
			const tile = Vars.world.tile(x, y);

			if (tile == null) return;

			Lines.stroke(1);
			Draw.color(signalOn);
			Drawf.circles(x * Vars.tilesize + this.offset(), y * Vars.tilesize + this.offset(), this.laserRange * Vars.tilesize);

			this.getPotentialLinks(tile, cons(other => {
				Drawf.square(other.drawx(), other.drawy(), other.block().size * Vars.tilesize / 2 + 2, Pal.place);
			}));

			Draw.reset();
		},
		draw(tile) {
			Draw.rect(this.getSignal(tile) ? this.onRegion : this.region, tile.drawx(), tile.drawy());
		},
		drawLayer(tile) {
			if (Core.settings.getInt("lasersopacity") == 0) return;

			if (tile.entity != null) {
				const s = tile.entity.signals;

				for (var i in s.links) {
					this.drawLaser(tile, Vars.world.tile(s.links[i]));
				}

				Draw.reset();
			}
		},
		drawLaser(tile, target) {
			const t1 = this.t1, t2 = this.t2;
			const opacity = Core.settings.getInt("lasersopacity") / 100;

			var x1 = tile.drawx(), y1 = tile.drawy(),
			x2 = target.drawx(), y2 = target.drawy();

			const angle = Angles.angle(x1, y1, x2, y2);
			t1.trns(angle, tile.block().size * Vars.tilesize / 2 - 1.5);
			t2.trns(angle + 180, target.block().size * Vars.tilesize / 2 - 1.5);

			x1 += t1.x;
			y1 += t1.y;
			x2 += t2.x;
			y2 += t2.y;

			Draw.color(Color.white, this.getSignal(tile) ? signalOn : signalOff, 0.86 + Mathf.absin(3, 0.1));
			Draw.alpha(opacity );
			Drawf.laser(this.laser, this.laserEnd, x1, y1, x2, y2, 0.25);
			Draw.color();
		},
		drawConfigure(tile) {
			Draw.color(signalOn);

			Lines.stroke(1.5);
			Lines.circle(tile.drawx(), tile.drawy(),
				tile.block().size * Vars.tilesize / 2 + 1 + Mathf.absin(Time.time(), 4, 1));

			Drawf.circles(tile.drawx(), tile.drawy(), this.laserRange * Vars.tilesize);

			Lines.stroke(1.5);

			if (tile.entity != null) {
				var link;
				const s = tile.ent().signals;
				for (var x = tile.x - this.laserRange - 2; x <= tile.x + this.laserRange + 2; x++) {
					for (var y = tile.y - this.laserRange - 2; y <= tile.y + this.laserRange + 2; y++) {
						link = Vars.world.tile(x, y);

						if (s.links.includes(Pos.get(x, y)) == true) {
							Drawf.square(link.drawx(), link.drawy(), link.block().size * Vars.tilesize / 2 + 1, Pal.place);
						}
					}
				}
			}

			Draw.reset();
		},

		overlaps(x, y, other, range) {
			return Intersector.overlaps(Tmp.cr1.set(x, y, range), other.getHitbox(Tmp.r1));
		},

		getPotentialLinks(tile, others) {
			const valid = boolf(other => {
				return other != null && other != tile
					&& other.entity != null && other.entity.signals != null
					&& this.overlaps(tile.x * Vars.tilesize + this.offset(), tile.y * Vars.tilesize + this.offset(), other, this.laserRange * this.tilesize)
					&& other.getTeam() == Vars.player.getTeam();
			});

			this.tempTiles.clear();
			Geometry.circle(tile.x, tile.y, this.laserRange + 2, intc2((x, y) => {
				const other = Vars.world.ltile(x, y);
				if(valid.get(other) && !this.tempTiles.includes(other)){
					this.tempTiles.add(other);
				}
			}));

			this.tempTiles.each(valid, cons(t => {
				others.get(t);
			}));
		},

		configured(tile, player, pos) {
			const s = tile.ent().signals;
			const other = Vars.world.tile(pos);

			// unlink
			for (var i in s.links) {
				if (s.links[i] === pos) {
					s.links.splice(i, 1);
					return;
				}
			}

			// link if possible and it not linked already
			if (this.linkValid(tile, other)) {
				s.link(tile, other);
			}
		},
		onConfigureTileTapped(tile, other){
			if (tile.entity != null) {
				const s = tile.ent().signals;
				other = other.link();

				if (tile == other) {
					if (s.links.length == 0) {
						this.getPotentialLinks(tile, cons(link => {
							tile.configure(link.pos());
						}));
					} else {
						for (var i in s.links) {
							tile.configure(s.links[i]);
						}
						s.links.length = 0;
					}
					return false;
				}

				if (this.linkValid(tile, other)) {
					tile.configure(other.pos());
					return false;
				}

				return true;
			}
			return true;
		},

		linkValid(tile, other) {
			return (Mathf.dst(tile.x, tile.y, other.x, other.y) <= this.laserRange)
				&& (tile.getTeamID() == other.getTeamID())
				&& (tile.ent().signals.links.length < this.maxNodes)
				&& (other.ent().signals !== undefined)
				&& (other.ent().signals.links.length < this.maxNodes)
				&& (other.ent().signals.links.includes(tile.pos()) == false);
		},

		layer: Layer.power,
		laserRange: 6,
		maxNodes: 3,
		solid: true,
		configurable: true,
		expanded: true,
		breakable: true
	},

	Switch: {
		load() {
			this.super$load();
			this.onRegion = Core.atlas.find(this.name + "-on");
		},
		draw(tile) {
			Draw.rect(this.getSignal(tile) ? this.onRegion : this.region, tile.drawx(), tile.drawy());
		},
		onConfigureTileTapped(tile, other){
			Sounds.click.at(tile.x, tile.y);
			this.setSignal(tile, !this.getSignal(tile));
			return true;
		},
		configurable: true,
		breakable: true,
		solid: true,
		signalWriteOnly: true
	},

	Lamp: {
		draw(tile) {
			this.super$draw(tile);
			const e = tile.ent();

			Draw.blend(Blending.additive);
			Draw.color(Tmp.c1.set(e.color), this.getSignal(tile) * 0.3);
			Draw.rect(this.reg(this.topRegion), tile.drawx(), tile.drawy());
			Draw.color();
			Draw.blend();
		},
		hasPower: false
	},

	Module: {
		write(stream) {
			stream.writeShort(this.links.length);
			for (var i in this.links) {
				stream.writeInt(this.links[i]);
			}
			stream.writeBoolean(this.signal);
		},
		read(stream) {
			this.links.length = stream.readShort();
			for(var i = 0; i < this.links.length; i++){
				this.links[i] = stream.readInt();
			}
			this.signal = stream.readBoolean();
		},
		_set(signal, already) {
			for (var i in this.links) {
				const pos = this.links[i];
				// anti snek-of-stack-overflow
				if (already.includes(pos) == true) {
					continue;
				}
				already[already.length] = pos;
				const tile = Vars.world.tile(Pos.x(pos), Pos.y(pos));
				if (tile != null) {
					const e = tile.ent();
					if (e.signal != undefined) {
						e.signal.set(signal);
					}
				}
			}
			if (!this.readOnly) {
				this.signal = signal;
			}
		}, set(signal) { this._set(signal, []); },
		link(tile, other) {
			const s = other.ent().signals;
			if (s.readOnly) {
				s.link(other, tile);
			} else {
				//s.set(this.signal);
				this.links.push(other.pos());
			}
		},

		// `Pos`es of blocks that this one outputs to.
		links: [],
		// Current signal of this block
		signal: false,
		// If other blocks cannot set its signal, set with signalReadOnly in a block def.
		readOnly: false
	}
}