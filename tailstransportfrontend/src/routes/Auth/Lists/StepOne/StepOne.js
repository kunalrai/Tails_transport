import { connect } from 'react-redux'
import _ from 'lodash'
import { getAnimalsIds, selectAnimal } from './Actions/getAnimals'
import StepHistory from '../StepHistory'
import NextStep from '../NextStep'
import { browserHistory } from 'react-router'
import '../lists.scss'
import config from 'config'
var Isvg = require('react-inlinesvg')

class StepOne extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            disabled: true,
            animals: config.animals.map((animal, index) => {
                return Object.assign({}, animal, {id: index + 1, height: '', weight: '', special_notes: null, impagePreview: [] });
            })
        }
    }

    componentWillMount() {
        this.props.getAnimalsIds()
    }

    componentDidMount() {
        this.checkSelectedAnimals()
    }

    checkSelectedAnimals() {
        const { animalInfos } = this.props
        if(animalInfos.selectedAnimals.length > 0) {
            this.setState({ disabled: false })
        }
    }

    selectImg(val) {

        const { disabled } = this.state
        const { animalInfos } = this.props

        val.impagePreview = []

        const index = _.findIndex(animalInfos.selectedAnimals, item => item.id == val.id)
        if(index == -1) {
            this.setState({ disabled: false })
            this.props.selectAnimal(val, true)
        } else {
            this.props.selectAnimal(val, false)
        }

        if(animalInfos.selectedAnimals.length == 0) {
            this.setState({ disabled: true })
        }
    }
    nextStep = () =>{

        browserHistory.push({
			pathname: '/step-two',
			state: this.props
		});
    }
    render() {

        console.log('render')

        const { animalInfos } = this.props
        const { selectedAnimal, disabled } = this.state

        console.log('animalInfos', animalInfos)

        // if(animalInfos.loaded) {
            console.log('animalInfos.loaded')
            console.log('animals', this.state.animals)
            return (
                <div className="create-list">
                    <div className="container">
                        <StepHistory currentState="stepOne"/>
                        <div className="step-one">
                            <div className="comment">
                                What kind of animals do you need shipped ?
                            </div>
                            <div className="animal-list row">
                                {
                                    this.state.animals.map((val, index) =>
                                        <div className="animal-item col-md-2 col-sm-4" key={val.id}>
                                            <div
                                                className={
                                                    animalInfos.selectedAnimals.length > 0 && _.find(animalInfos.selectedAnimals, item => item.id == val.id)
                                                    ? "select-animal-image animal-image"
                                                    : "animal-image"
                                                }
                                                onClick={()=>this.selectImg(val)}>
                                                <Isvg
                                                    src={val.url}
                                                    className="img-responsive"/>
                                    
                                            </div>
                                            <div className="animal-name">{val.name}</div>
                                        </div>
                                    )
                                }
                            </div>
                            {/* <button
                                className={disabled ? "btn btn-next disabled" : "btn btn-next"  }
                                onClick={() => this.nextStep()}
                                disabled={disabled}
                            >Next</button> */}
                            <NextStep nextStep="/step-two" disabled={disabled}/>
                        </div>
                    </div>
                </div>
            )
        // }
        // else {
        //     console.log('else')
        //     return null
        // }
    }
}

const mapStateToProps = state => ({
    animalInfos: state.animalsReducer
})

const mapDispatchToProps = dispatch => ({
    getAnimalsIds: () => dispatch(getAnimalsIds()),
    selectAnimal: (value, flag) => dispatch(selectAnimal(value, flag))
})

export default connect(mapStateToProps, mapDispatchToProps)(StepOne)
