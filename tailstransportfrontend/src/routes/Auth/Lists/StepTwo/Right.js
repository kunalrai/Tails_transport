import Dropzone from 'react-dropzone'
import _ from 'lodash'
import FileUpload from './FileUpload'
import config from '../../../../config'

export default class Right extends React.Component {

  constructor (props) {
    super(props)
    this.state = {
      animalType: config.animals[ 0 ],
      animalTypeIndex: 0,
    }
  }

  setAnimalProperty (field, value) {
    this.props.setAnimalProperty(field, value.target.value)
  }

  setAnimalPropertyType (value) {
    if (value.target.value &&
      typeof config.animals[ value.target.value ] != 'undefined') {
      this.setState({ animalType: config.animals[ value.target.value ] })
      this.setState({ animalTypeIndex: value.target.value })
      this.props.setAnimalProperty(field,
        config.animals[ value.target.value ].breed)
    }
  }

  componentWillReceiveProps (nextProps) {
    const { breed } = nextProps
    const index = _.findIndex(config.animals, (item) => {
      return item.breed === breed
    })
    this.setState({
      animalTypeIndex: index,
      animalType: config.animals[ index ],
    })
  }

  render () {
    console.log('this.props', this.props.breeds)
    const {
      animal_types,
      name,
      breed,
      height,
      weight,
      special_notes,
      showPreview,
      impagePreview,
      animal_breed,
    } = this.props
    const { animalType, animalTypeIndex } = this.state

    console.log('impagePreview', impagePreview)
    return (
      <div className="main-body col-sm-8 col-12">
        <div className="form-group">
          <div className="row">
            <div className="col-sm-6 col-12 hidden">
              <label>Animal Type</label>
              <select
                className="form-control"
                name="breed"
                value={animalTypeIndex}
                onChange={this.setAnimalPropertyType.bind(this, 'breed')}>
                {
                  _.map(config.animals, (item, key) =>
                    <option
                      // key={item.id}
                      value={key}>{item.breed}</option>,
                  )
                }
              </select>
            </div>
            <div className="col-sm-12 col-12">
              <label>Breed</label>
              {animalType &&
              <select
                className="form-control breed-select"
                name="animal_breed"
                value={animal_breed}
                onChange={this.setAnimalProperty.bind(this, 'animal_breed')}>
                {_.map(animalType.breeds, (item) =>
                  <option value={item}>{item}</option>,
                )}
              </select>
              }
            </div>
          </div>

        </div>
        <div className="form-group">
          <div className="row">
            <div className="col-sm-6 col-12">
              <label>Height of Animal(Feet)</label>
              <input
                type="number"
                className="form-control"
                name="height"
                value={height}
                onChange={this.setAnimalProperty.bind(this, 'height')}/>
            </div>
            <div className="col-sm-6 col-12">
              <label>Weight of Animal(Lbs)</label>
              <input
                type="number"
                className="form-control"
                name="weight"
                value={weight}
                onChange={this.setAnimalProperty.bind(this, 'weight')}/>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label>Special Notes for Animal</label>
          <textarea
            rows="3"
            className="form-control"
            name="special_notes"
            value={special_notes ? special_notes : ''}
            onChange={this.setAnimalProperty.bind(this, 'special_notes')}/>
        </div>
        {<FileUpload
          onDrop={this.props.onDrop}
          animalImageDel={this.props.animalImageDel}
          impagePreview={impagePreview}/>}
      </div>
    )
  }
}
