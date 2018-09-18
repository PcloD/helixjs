/**
 * @ignore
 * @constructor
 * @author derschmale <http://www.derschmale.com>
 */
export function CachedProgram()
{
	this.program = null;
	this.frameMark = 0;
	this.key = null;
	this.isCached = true;
	this.renderOrderHint = 0;
}