import './ListDetails.scss';
import { Component } from 'react'
import ListItem from '../ListItem/ListItem'
import ListingSidebar from '../Sidebar/ListingSidebar'
import ListingDetailsSidebar from '../Sidebar/ListingDetailsSidebar'
import { connect } from 'react-redux'
import { getListing } from '../../../../actions/listing'
import ListBids from "../ListBids/ListBids"
import  {CLEAR_DATA_LISTING} from 'config/actionTypes'

class ListDetails extends Component {
  constructor(props){
    super(props)
  }

  componentWillMount(){
    this.props.dispatch({type: CLEAR_DATA_LISTING})
  }

  componentDidMount(){
    this.props.dispatch({type: CLEAR_DATA_LISTING});
    this.props.getListing(this.props.params.id);
  }

  render() {

    if (Object.keys(this.props.listing.data).length > 0 && this.props.listing.data.user_id == this.props.user.id) {
      return(
        <main>
          <section id="main-content">
            <div className="container">
              <div className="row list-items">
                <div className="col-md-12">

                  { (Object.keys(this.props.listing.data).length > 0) ?

                    <ListItem
                      id={this.props.listing.data.id}
                      title={this.props.listing.data.title}
                      created_at={this.props.listing.data.created_at}
                      pick_up_city={this.props.listing.data.pick_up_city}
                      pick_up_state={this.props.listing.data.pick_up_state}
                      desired_pick_up_date={this.props.listing.data.desired_pick_up_date}
                      delivery_city={this.props.listing.data.delivery_city}
                      delivery_state={this.props.listing.data.delivery_state}
                      desired_delivery_date = {this.props.listing.data.desired_delivery_date}
                      budget={this.props.listing.data.budget}
                      other_notes={this.props.listing.data.other_notes}
                      bids_count={this.props.listing.data.bids_count}
                      listing_details={false}
                    />

                    : '' }

                  <ListBids />

                </div>

              </div>
            </div>
          </section>
        </main>
      )
    } else {
      if(Object.keys(this.props.listing.data).length > 0 && this.props.listing.data.user_id != this.props.user.id)
        return(
        <main>
          <section id="main-content">
            <div className="container">
              <div className="row list-items">
                <div className="col-md-8">

                  { (Object.keys(this.props.listing.data).length > 0) ?

                    <ListItem
                      id={this.props.listing.data.id}
                      title={this.props.listing.data.title}
                      created_at={this.props.listing.data.created_at}
                      pick_up_city={this.props.listing.data.pick_up_city}
                      pick_up_state={this.props.listing.data.pick_up_state}
                      desired_pick_up_date={this.props.listing.data.desired_pick_up_date}
                      delivery_city={this.props.listing.data.delivery_city}
                      delivery_state={this.props.listing.data.delivery_state}
                      desired_delivery_date = {this.props.listing.data.desired_delivery_date}
                      budget={this.props.listing.data.budget}
                      other_notes={this.props.listing.data.other_notes}
                      bids_count={this.props.listing.data.bids_count}
                      listing_details={false}
                    />

                    : '' }

                </div>

                <div className="col-md-4 sidebar">
                  <ListingDetailsSidebar
                    id={this.props.params.id}
                    title={this.props.listing.data.title}
                    budget={this.props.listing.data.budget}
                  />
                </div>

              </div>
            </div>
          </section>
        </main>
        )
      else
        return null;
    }

  }
}

const mapStateToProps = state => ({
  listing: state.listing,
  user: state.profile.data
})

const mapDispatchToProps = dispatch => ({
  dispatch: dispatch,
  getListing: (id) => dispatch(getListing(id))
})

export default connect(mapStateToProps, mapDispatchToProps)(ListDetails);
