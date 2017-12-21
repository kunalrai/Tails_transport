import React, { Component } from 'react'
import { Link } from 'react-router'
import './Notification.scss'
import { connect } from 'react-redux'
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Popover,
  PopoverTitle,
  PopoverContent,
} from 'reactstrap'
import FaIconNotification from 'react-icons/lib/fa/bell-o'
import { getNotification } from 'actions/notifications_bid'

class Notification extends Component {
  constructor (props) {
    super(props)
    this.state = {
      popoverOpen: false,
      dropdownOpen: false,
    }

    this.toggle = this.toggle.bind(this)
    this.onclose = this.onclose.bind(this)
  }

  toggle (type = 'dropdownOpen') {
    let count = this.props.notifications.length
    if (count > 0) {
      this.setState({
        [type]: !this.state[type],
      })
    }

  }

  componentWillMount () {
    this.props.getNotification()
  }

  onclose () {
    this.setState({
      popoverOpen: false,
    })
  }

  render () {
    let count = 0
    this.props.notifications.map(notification => {
      if (notification.bid) {
        count++
      }
    })
    return (
      <div>

        <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggle}>
          <DropdownToggle
            tag="span"
            onClick={this.toggle}
            data-toggle="dropdown"
            aria-expanded={this.state.dropdownOpen}
          >
            <a id="Popover2" className="NotificationBell"
               onClick={this.toggle}><FaIconNotification/></a>
            <label className="labelCount" style={{
              display: count > 0
                ? 'inline-block'
                : 'none',
            }}>{count}</label>
          </DropdownToggle>
          <DropdownMenu right style={{'top': '56px'}}>
            <div className="afte-rec"></div>
            {this.props.notifications.map((notification, index) => {
                if (notification.notification_type == 'offer_sent') {
                  return <li key={index}>
                    <Link onClick={this.onclose}
                          to={`/notification/${notification.id}`}>{notification.listing.user.first_name} has
                      offered a
                      shipment to you. Click here to accept</Link>
                  </li>
                }
                if (notification.notification_type == 'pending_peyment') {
                  return <li key={index}>
                    <Link onClick={this.onclose}
                          to={`/notification/${notification.id}`}>{notification.bid.user.first_name} has
                      accepted your offer! Click here to fund the shipment
                      now'</Link>
                  </li>
                }
              },
            )}
          </DropdownMenu>
        </Dropdown>

      </div>
    )
  }
}

const mapDispatchToProps = (dispatch) => ({
  getNotification: () => dispatch(getNotification()),
})

const mapStateToProps = (state) => ({
  notifications: state.notifications_bid.data,
  user: state.profile.data,
})
export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(
  Notification)
