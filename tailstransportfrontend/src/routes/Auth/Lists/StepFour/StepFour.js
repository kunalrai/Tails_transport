import { connect } from 'react-redux'
import { Link } from 'react-router'
import StepHistory from '../StepHistory'
import NextStep from '../NextStep'
import {
  createListings,
  createAnimalInfo,
  updateListings,
} from '../Actions/listing'
import '../lists.scss'
import { browserHistory } from 'react-router'

class StepFour extends React.Component {

  constructor (props) {
    super(props)
    console.log('step 4 =============================')
    console.log(this.props)
    var updateVal = this.props.location.state

    if (updateVal.title == undefined) {
      this.state = {
        title: '',
        budget: '',
        summary: '',
        disabled: true,
      }
    } else {
      this.state = {
        title: updateVal.title,
        budget: updateVal.budget,
        summary: updateVal.other_notes,
        disabled: false,
      }
    }
  }

  setValue = (field, value) => {
    this.setState({ [ field ]: value.target.value })
    const self = this
    setTimeout(function () {
      self.validate()
    }, 100)
  }

  prevStep () {

    let sendVal = {
      pick_up_address: this.props.location.state.pick_up_address,
      pick_up_state: this.props.location.state.pick_up_state,
      pick_up_city: this.props.location.state.pick_up_city,
      pick_up_zip: this.props.location.state.pick_up_zip,
      desired_pick_up_date: this.props.location.state.desired_pick_up_date,
      delivery_address: this.props.location.state.delivery_address,
      delivery_state: this.props.location.state.delivery_state,
      delivery_city: this.props.location.state.delivery_city,
      delivery_zip: this.props.location.state.delivery_zip,
      desired_delivery_date: this.props.location.state.desired_delivery_date,
      id: this.props.location.state.id,
      user_id: this.props.location.state.user_id,
      budget: this.state.budget,
      title: this.state.title,
      other_notes: this.state.summary,

    }
    console.log(sendVal)
    browserHistory.push({
      pathname: '/step-three',
      state: sendVal,
    })
  }

  validate () {
    const {
      title,
      budget,
      summary,
    } = this.state

    if (title == '' ||
      budget == '' ||
      summary == '') {
      this.setState({ disabled: false })
    } else {
      this.setState({ disabled: false })
    }
  }

  saveAll = () => {
    const { animalShipReducer, animalInfos } = this.props
    const listing = {
      title: this.state.title,
      pick_up_address: animalShipReducer.shipInfo.pick_up_address,
      pick_up_city: animalShipReducer.shipInfo.pick_up_city,
      pick_up_state: animalShipReducer.shipInfo.pick_up_state,
      pick_up_zip: animalShipReducer.shipInfo.pick_up_zip,
      desired_pick_up_date: animalShipReducer.shipInfo.desired_pick_up_date,
      delivery_address: animalShipReducer.shipInfo.delivery_address,
      delivery_city: animalShipReducer.shipInfo.delivery_city,
      delivery_state: animalShipReducer.shipInfo.delivery_state,
      delivery_zip: animalShipReducer.shipInfo.delivery_zip,
      desired_delivery_date: animalShipReducer.shipInfo.desired_delivery_date,
      other_notes: this.state.summary,
      budget: this.state.budget,
    }
    let animals = []
    let animals_images = []

    for (let i = 0; i < animalInfos.selectedAnimals.length; i++) {

      let animalInfo = {
        name: animalInfos.selectedAnimals[ i ].breed,
        breed: animalInfos.selectedAnimals[ i ].animal_breed,
        height: animalInfos.selectedAnimals[ i ].height,
        weight: animalInfos.selectedAnimals[ i ].weight,
        special_notes: animalInfos.selectedAnimals[ i ].special_notes,
        images: animalInfos.selectedAnimals[ i ].impagePreview.length > 0
          ? animalInfos.selectedAnimals[ i ].impagePreview
          : null,
      }
      animals.push(animalInfo)
    }
    let data = { listing, animals }
    if (this.props.location.state.id == '') {
      this.props.createListings(data)
      // this.props.createAnimalInfo("13", animalList)

    } else {
      var id = this.props.location.state.id
      this.props.updateListings(id, listVal)
    }
  }

  render () {
    const {
      title,
      budget,
      summary,
      disabled,
    } = this.state

    return (
      <div className="create-list">
        <div className="container">
          <StepHistory currentState="stepFour"/>
          <div className="step-four">
            <div className="comment">
              Tell us a little more about your listing
            </div>
            <div className="main-content">
              <div className="form-group">
                <div className="row">
                  <div className="col-md-8 col-12">
                    <label>Listing Title</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={title}
                      onChange={this.setValue.bind(this, 'title')}/>
                  </div>
                  <div className="col-md-4 col-12">
                    <label>Budget</label>
                    <input
                      type="text"
                      className="form-control"
                      name="budget"
                      value={budget}
                      onChange={this.setValue.bind(this, 'budget')}/>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Summary of Listing</label>
                <textarea
                  rows="4"
                  className="form-control"
                  name="summary"
                  value={summary}
                  onChange={this.setValue.bind(this, 'summary')}/>
              </div>
            </div>
            <div className="btn-section">
              <button
                className="btn btn-prev"
                onClick={this.prevStep.bind(this)}
                disabled={disabled}
              >prev
              </button>
              <button
                className={disabled ? 'btn btn-next disabled' : 'btn btn-next'}
                onClick={() => this.saveAll()}
                disabled={disabled}
              >Next
              </button>
            </div>

          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  animalInfos: state.animalsReducer,
  listing: state.listing,
  animalShipReducer: state.animalShipReducer,
})

const mapDispatchToProps = dispatch => ({
  createListings: (value) => dispatch(createListings(value)),
  updateListings: (id, value) => dispatch(updateListings(id, value)),
  createAnimalInfo: (id, value) => dispatch(createAnimalInfo(id, value)),
})

export default connect(mapStateToProps, mapDispatchToProps)(StepFour)
