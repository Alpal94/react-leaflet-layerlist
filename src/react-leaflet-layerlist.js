import PropTypes from 'prop-types';
import { MapControl, withLeaflet } from 'react-leaflet';
import L from 'leaflet';

var equal = require('deep-equal');

var ReactDOM = require('react-dom');

import './styles.css';


L.Control.LayerListControl = L.Control.extend({
	_layerListContainer: null,
	_isOpen: false,
	_layerlistItems: [],
	_children: [],
	_openButton: null,
	_closeButton: null,
	_openButtonStyle: null,
	_closeButtonStyle: null,
	_layerListStyle: null,
	_position: null,
	_style: null,
	initialize: function(element) {
		this._position = element.position;
		this._children = this.initChildren(element.children);
		this._layerListItems = new Array();
		this._style = element.style;
		this._renderExclude = element.renderExclude;
		this._openButtonStyle = element.openButtonStyle;
		this._closeButtonStyle = element.closeButtonStyle;
		this._onOpen = element.onOpen;
		this._onClose = element.onClose;
		this._startOpen = element.startOpen;
		this._debounceActive = false;
	},
	initChildren(children) {
		var newChildren = [];
		for(var i = 0; i < children.length; i++){
			if(children[i]) {
				if(children[i]._tail || children[i]._root) { 
					children[i].map((element) => {
						if(element) {
							newChildren.push(element);
						}
					});
				} else {
					newChildren.push(children[i]);
				}
			}
		}
		return newChildren;
	},
	onAdd: function(map) {

		this.options.position  = this._position;
		this._layerListContainer = L.DomUtil.create('div', 'layer-list-container closed');		
		this._openButton = L.DomUtil.create('div', 'layer-list-open-button visible', this._layerListContainer);
		this._closeButton = L.DomUtil.create('div', 'layer-list-close-button hidden', this._layerListContainer);
		this._map = map;
		
		if (this._openButtonStyle) {
			Object.keys(this._openButtonStyle).forEach(key => {
				this._openButton.style[key] = this._openButtonStyle[key];
			});
		}

		if (this._closeButtonStyle) {
			Object.keys(this._closeButtonStyle).forEach(key => {
				this._closeButton.style[key] = this._closeButtonStyle[key];
			});
		}
		if(this._startOpen) this.open(map);
		L.DomEvent.on(this._openButton, 'click', () => {
			this.open(map);
		});

		L.DomEvent.on(this._closeButton, 'click', () => {
			this.close(map);
		});

		L.DomEvent.on(this._map, 'click', () => {
			if (this._isOpen) {
				this.close(map);
			}
		});

		L.DomEvent.disableClickPropagation(this._openButton);
		L.DomEvent.disableClickPropagation(this._closeButton);
		L.DomEvent.disableClickPropagation(this._layerListContainer);
		L.DomEvent.disableScrollPropagation(this._layerListContainer);
		return this._layerListContainer;
	},
	onRemove: function(map) {
		// Do nothing
	},
	open: function(map) {
		if (!this._isOpen) {
			if(this._onOpen) this._onOpen();
			L.DomUtil.removeClass(this._openButton, 'visible');
			L.DomUtil.addClass(this._openButton, 'hidden');

			L.DomUtil.removeClass(this._closeButton, 'hidden');
			L.DomUtil.addClass(this._closeButton, 'visible');

			L.DomUtil.removeClass(this._layerListContainer, 'closed');
			L.DomUtil.addClass(this._layerListContainer, 'open');

			if (this._style) {
				Object.keys(this._style).forEach(key => {
					this._layerListContainer.style[key] = this._style[key];
				});
			}

			this._showLayerlistElements(map);
			this._isOpen = true;			
		}
	},
	close: function(map) {
		L.DomUtil.removeClass(this._openButton, 'hidden');
		L.DomUtil.addClass(this._openButton, 'visible');

		L.DomUtil.removeClass(this._closeButton, 'visible');
		L.DomUtil.addClass(this._closeButton, 'hidden');

		L.DomUtil.removeClass(this._layerListContainer, 'open');
		L.DomUtil.addClass(this._layerListContainer, 'closed');
		this._removeLayerlistElements(map);

		if(this._onClose) this._onClose();
		if (this._style) {
			Object.keys(this._style).forEach(key => {
				this._layerListContainer.style[key] = null;
			});
		}

		this._isOpen = false;
	},
	_showLayerlistElements: function(map) {
		for (var index = 0; index < this._children.length; index++) {
			var item = this._children[index];
			var container = L.DomUtil.create('div', 'layer-list-item-container item-' + index, this._layerListContainer);
			this._layerListItems.push(container);
			const el = ReactDOM.createPortal(item, container);
			ReactDOM.render(el, container);
		}
	},
	_removeLayerlistElements: function(map) {
		for (var index = 0; index < this._layerListItems.length; index++) {
			var item = this._layerListItems[index];
			L.DomUtil.remove(item);
		}
		this._layerListItems = [];
	},
	_updateLayerlistElements: function(element) {
		if(this._isOpen && !this._debounceActive) {
			var map = this._map;
			this._debounceActive = true;
			var newChildren = this.initChildren(element.children);

			var keepLayerListItems = [];
			var farCan = false;
			var numberOfItems = newChildren.length > this._children.length ? newChildren.length : this._children.length;
			for (var index = 0; index < numberOfItems; index++) {
				if(!farCan && newChildren[index] && this._children[index] && this._compareNodes(this._children[index], newChildren[index])) {
					keepLayerListItems.push(this._layerListItems[index]);
				} else {
					farCan = true;
					var item = newChildren[index];
					var layerItem = this._layerListItems[index];
					if(layerItem) {
						L.DomUtil.remove(layerItem);
					}
					if(newChildren[index]) {
						var container = L.DomUtil.create('div', 'layer-list-item-container item-' + index, this._layerListContainer);
						keepLayerListItems.push(container);
						const el = ReactDOM.createPortal(item, container);
						ReactDOM.render(el, container);
					}
				}
			}
			this._layerListItems = keepLayerListItems;
			this._children = newChildren;
			setTimeout(this._setDebounce.bind(this), 100);
		} else {
			this._children = this.initChildren(element.children);
		}
	},
	_setDebounce: function() {
		this._debounceActive = false;
	},
	_compareNodes: function(node1, node2) {
		return this.stringifyNode(node1, this._renderExclude) === this.stringifyNode(node2, this._renderExclude);
	}, stringifyNode(node, exclude) {
		var cache = [];
		var stringify = JSON.stringify(node, function(key, value) {
			if (typeof value === 'object' && value !== null) {
				if (cache.indexOf(value) !== -1) {
					return;
				}
				cache.push(value);
			}
			if(key === "_owner") return undefined;
			if(exclude && exclude.length) {
				for(var i = 0; i < exclude.length; i++) {
					if(key === exclude[i]) return undefined;
				}
			}
			return value;
		});
		cache = null; 
		return stringify;
	}
});

L.control.layerListControl = (opts) => {
    return new L.Control.LayerListControl({...opts});
}

class ReactLeafletLayerList extends MapControl {

	constructor(props) {
		super(props);
	}

	componentWillReceiveProps() {
		this._layerList._updateLayerlistElements(this.props);
	}

	createLeafletElement(props) {
		this._layerList = L.control.layerListControl({
			position: props.position || 'topright',
			style: props.style,
			onOpen: props.onOpen,
			onClose: props.onClose,
			startOpen: props.startOpen,
			renderExclude: props.renderExclude,
			openButtonStyle: props.openButtonStyle,
			...props
		});
		return this._layerList;
	}
}

export default withLeaflet(ReactLeafletLayerList);


ReactLeafletLayerList.propTypes = {
	position: PropTypes.oneOf(['topright', 'topleft', 'bottomright', 'bottomleft']),
	style: PropTypes.objectOf(PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number,
	])),
	openButtonStyle: PropTypes.objectOf(PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number,
	])),
	closeButtonStyle: PropTypes.objectOf(PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number,
	])),
	onOpen: function() { return null },
	onClose: function() { return null },
	renderExclude: [],
	open: true,
	startOpen: false
};
