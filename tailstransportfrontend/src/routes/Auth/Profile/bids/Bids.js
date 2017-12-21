import './Bids.scss'
import moment from 'moment'
import BidItem from './components/BidItem'

class Bids extends React.Component {
	constructor(props) {
		super(props)
	}

	componentWillMount() {
      this.props.getBids()
	}

	getBids() {
		const bids = []
		this.props.bids.data.map((bid, i) => {
			if(bid.listing != undefined){
				bids.push(this.renderBids(
					bid.id,
					bid.listing.title,
					moment(new Date(bid.created_at)).format('MM/DD/YYYY'),
					bid.status,
					bid.listing_id
				))
			}
		})
		return bids
	}

	renderBids(id, title, date, status, listing_id) {
		return (
			<BidItem
				key={id}
				id={id}
				title={title}
				dateBidded={date}
				status={status}
				listing_id={listing_id}
			/>
		)
	}

	render() {
		return (
			<table className="bids table table-bordered table-striped">
				<tbody>
					<tr>
						<th>Title</th>
						<th>Date Bidded</th>
						<th>Status</th>
						<th>Action</th>
					</tr>
					{this.getBids()}
				</tbody>
			</table>
		)
	}
}

export default Bids
