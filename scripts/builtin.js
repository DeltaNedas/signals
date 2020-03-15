const signals = require("library");

function node(name, max, range, size, req) {
	signals.extend(Block, TileEntity, name, [
		signals.Node,
		{
			maxNodes: max,
			laserRange: range,
			size: size
		}
	]).requirements(Category.effect, req);
}

node("node", 20, 6, 1, ItemStack.with(Items.copper, 1, Items.lead, 3));
node("node-large", 30, 9.5, 2, ItemStack.with(Items.titanium, 5, Items.lead, 10, Items.silicon, 3));
node("tower", 2, 30, 2, ItemStack.with(Items.titanium, 7, Items.lead, 10, Items.silicon, 15, Items.surgealloy, 15));

signals.extend(Block, TileEntity, "switch", [signals.Switch]).requirements(Category.effect, ItemStack.with(Items.copper, 3, Items.silicon, 5));
signals.extend(LightBlock, LightBlock.LightEntity, "lamp", [signals.Lamp]).requirements(Category.effect, ItemStack.with(Items.graphite, 4, Items.silicon, 2));