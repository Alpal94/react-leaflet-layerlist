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
		console.log(element);
		this._position = element.position;
		this._children = element.children;
		this._layerListItems = new Array();
		this._style = element.style;
		this._openButtonStyle = element.openButtonStyle;
		this._closeButtonStyle = element.closeButtonStyle;
		this._onOpen = element.onOpen;
		this._onClose = element.onClose;
		this._startOpen = element.startOpen;
		this._debounceActive = false;
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
			console.log("GREAT GREAT");
			var map = this._map;
			this._debounceActive = true;
			this._newChildren = new Array();
			for(var i = 0; i < element.children.length; i++) {
				if(element.children[i])
					this._newChildren.push(element.children[i]);
			}
			console.log("START");
			var oldChildren = this._children;
			var tmpLayer = this._layerListItems;

			var offset = 0;
			//Remove
			for (var oldIndex = 0; oldIndex < oldChildren.length; oldIndex++) {
				var willRemove = true;
				var _undefined = true;
				for (var index = 0; index < this._newChildren.length; index++) {
					_undefined = false;

					if(this._newChildren[index] && oldChildren[oldIndex] && oldChildren[oldIndex].props.id === this._newChildren[index].props.id) {
						willRemove = false;
						break;
					}
				}
				if(willRemove && !_undefined && this._newChildren.length && this._children.length) {
					console.log('Offset: ' + offset);
					console.log('Index: ' + oldIndex);
					console.log('New length: ' + this._newChildren.length);
					console.log('Old length: ' + oldChildren.length);

					L.DomUtil.remove(this._layerListItems[oldIndex + offset]);

					//modifying here when reuse later

					var children = new Array();
					var newLayer = new Array();
					for(var i = 0; i < this._children.length; i++) {
						if(i !== oldIndex + offset) {
							children.push(this._children[i]);
							newLayer.push(this._layerListItems[i]);
							console.log("OK");
						} else console.log("REMOVE");
					}
					this._children = children;
					this._layerListItems = newLayer;
					offset++;
				}
			}

			//Add
			for (var addIndex = 0; addIndex < this._newChildren.length; addIndex++) {
				var willAdd = true;
				for (var oldIndex = 0; oldIndex < this._children.length; oldIndex++) {
					if(this._children[oldIndex] && this._newChildren[addIndex] && this._newChildren[addIndex].props.id === this._children[oldIndex].props.id) {
						willAdd = false;
						break;
					}
				}
				if(willAdd) {
					console.log("ADDING");
					var container = L.DomUtil.create('div', 'layer-list-item-container item-' + index, this._layerListContainer);
					var item = this._newChildren[addIndex];
					const el = ReactDOM.createPortal(item, container);
					var children = new Array();
					for(var i = 0; i < this._children.length; i++) {
						children.push(this._children[i]);
					}
					children.push(item);
					this._children = children;
					this._layerListItems.push(container);
					ReactDOM.render(el, container);
				}
			}
			console.log("END");
			setTimeout(this._setDebounce.bind(this), 100);
		}
	},
	_setDebounce: function() {
		this._debounceActive = false;
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
		this._layerList = L.control.layerListControl({position: props.position || 'topright', style: props.style, onOpen: props.onOpen, onClose: props.onClose, startOpen: props.startOpen, openButtonStyle: props.openButtonStyle, ...props});
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
	open: true,
	startOpen: false
};
