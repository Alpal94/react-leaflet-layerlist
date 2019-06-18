import * as React from 'react'
import { Map, TileLayer, ZoomControl } from 'react-leaflet'
import { ReactLeafletLayerList, LayerListItem } from 'react-leaflet-styled-layerlist'
import { Container, Row, Col, Button } from 'reactstrap';

interface AppState {
	startState: boolean;
}

export default class App extends React.Component<{}, AppState> {
	constructor() {
		super();
		this.state = {
			startState: true
		}
	}

	componentDidMount() {
		//setInterval(() => this.setState({startState: !this.state.startState}), 3000);
	}

	render () {
		return (
			<div className="map">
				<Map
					ref={(ref) => this.ref}
					center={[44.635, 22.653]}
					zoom={12}
					zoomControl={false} >

					<TileLayer
							attribution=""
							url="https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"/>
				
					<ZoomControl />

					<ReactLeafletLayerList position="topright" startOpen={false} onOpen={() => console.log('Opening right drawer')}>
						<LayerListItem>
							<div>foo</div>
						</LayerListItem>
					</ReactLeafletLayerList>

					<ReactLeafletLayerList position="topleft" startOpen={false} onOpen={() => setInterval(() => this.setState({startState: !this.state.startState}), 3000)}>

						<LayerListItem id="danger">
							<Container>
								<Row>
									<Col md={6}>reactstrap</Col>
									<Col md={6}>enabled</Col>
								</Row>
							</Container>
						</LayerListItem>

						{!this.state.startState &&
							<LayerListItem id="good">
								<Container>
									<Row>
										<Button onClick={() => alert('clicked!') }>Button</Button>
									</Row>
								</Container>
							</LayerListItem>
						}
						<LayerListItem id="perhaps">
							<div>
								<h2>Elements in a div</h2>
								<p>With nested stuff</p>
							</div>
						</LayerListItem>

					</ReactLeafletLayerList>
		
				</Map>
			</div>
		)
	}
}
