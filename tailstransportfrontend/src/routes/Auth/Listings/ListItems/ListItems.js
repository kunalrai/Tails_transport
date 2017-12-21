import CowImage from 'assets/cow.jpg'
import DogImage from 'assets/dog.jpg'
import NumberFormat from 'react-number-format'
import Timestamp from 'react-timestamp'
import moment from 'moment'
import { Link } from 'react-router'
import PlaceholderSmall from 'assets/placeholder2-small.png'

const ListItems = props => {
  const {
    id,
    title,
    created_at,
    pick_up_city,
    pick_up_state,
    desired_pick_up_date,
    delivery_city,
    delivery_state,
    desired_delivery_date,
    budget,
    other_notes,
    bids_count,
    images,
    animals,
  } = props

  return (
    <div className="list-item">
      <Link to={`listing-details/` + id}>
        <div className="top-part">

          <div className="image-holder text-center">

            <img src={(images.length) ? images['0'].url : PlaceholderSmall}
                 className="main-image"/>

            <div className="thumbs">

              {(images.length > 1) ? images.map((image, index) => {

                  if (index < 3) {
                    return <a href="#"><img src={image.url} alt=""/></a>
                  }

                },
              ) : ''}

            </div>

          </div>

          <div className="right-content-holder">
            <div className="row">
              <div className="col-lg-7"><h3>{title}</h3></div>
              <div className="col-lg-5 item-meta">
                <div className="age-of-post pull-right">
                <span className="age">
                    <Timestamp time={created_at} precision={1}/>
                </span></div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12 top-destination">
                <span className="start">{pick_up_city}, {pick_up_state}</span>
                <i
                  className="btl bt-long-arrow-right"></i> <span
                className="finish">{delivery_city}, {delivery_state}</span>
                <div className="bid-count pull-right" onClick={this.toggle}>
                  <span className="count">{bids_count}</span></div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-12 listing-excerpt">
                <p>{other_notes}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bottom-details">
          <div className="animal-tags bottom-detail">{animals}</div>
          <div className="budget-details bottom-detail">
            <NumberFormat value={budget} displayType={'text'}
                          thousandSeparator={true} prefix={'$'}/>
          </div>
          <div className="date-details bottom-detail">Departing {moment(
            desired_pick_up_date).month() + 1} / {moment(desired_pick_up_date).
            date()} - Arriving {moment(desired_delivery_date).month() + 1}
            / {moment(desired_delivery_date).date()}</div>
        </div>
      </Link>
    </div>
  )

}

export default ListItems
