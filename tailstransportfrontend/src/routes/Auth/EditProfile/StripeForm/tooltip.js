import './tooltip.scss'
import React ,{Component } from 'react'

export default class Tooltip extends Component{

    render(){
        return(
            <div className="tooltips text-danger" >
               {this.props.label}
               
                <span>
                    <h4>Tooltip</h4>
                    <button  className="close-thin"></button>
                    <p>This is Tooltip</p>
                </span>
            
            </div>
        )
    }
}