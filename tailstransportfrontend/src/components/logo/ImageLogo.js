import './Logo.scss'
import logoImage from 'assets/logo.svg'

import { browserHistory } from 'react-router'


class ImageLogo extends React.Component {
	constructor(props) {
		super(props) 

		this.toHome = this.toHome.bind(this);
	}

	toHome() {
		browserHistory.push('/')
	}

	render() {
		return (
			<div 
				id="image-logo"
				className="d-flex flex-row flex-wrap align-items-center justify-content-start"
				onClick={this.toHome}>
				<img src={logoImage} alt=""/>
			</div>
		)
	}
}
export default ImageLogo