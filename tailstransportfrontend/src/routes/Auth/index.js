import AuthorizedContainer from 'containers/AuthorizedContainer'

import Mock from './MockBackend/Mock'
import Profile from './Profile/Profile'
import Notification from './Notification/Notification'
import EditProfile from './EditProfile/EditProfile'
import StepOne from './Lists/StepOne/StepOne'
import StepTwo from './Lists/StepTwo/StepTwo'
import StepThree from './Lists/StepThree/StepThree'
import StepFour from './Lists/StepFour/StepFour'
import ReviewItem from './Profile/listings/ReviewItem'
import Messages from './Messages/messages'
import AllListings from './Listings/ListingsContainer'
import ListDetails from './Listings/ListDetails/ListDetails'


export default {
	component: AuthorizedContainer,
	childRoutes: [
		{
      path: '/profile',
      component: Profile
    },
    {
      path: '/notification/:id',
      component: Notification
    },
		{
			path: '/profile/edit',
			component: EditProfile
		},
		{
			path: '/step-one',
			component: StepOne
		},
		{
			path: '/step-two',
			component: StepTwo
		},
		{
			path: '/step-three',
			component: StepThree
		},
		{
			path: '/step-four',
			component: StepFour
		},
		{
			path: '/profile/item-review',
			component: ReviewItem
		},
	    {
	      path: '/listings',
	      component: AllListings
	    },
	    {
	      path: '/listing-details/:id',
	      component: ListDetails
	    },
		{
			path: '/messages',
			component: Messages
		},
		{
			path: '/mock',
			component: Mock
		}
	]
}
