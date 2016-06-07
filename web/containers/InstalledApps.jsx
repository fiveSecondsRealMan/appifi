import React from 'react'

import { Paper, Avatar, LinearProgress, Divider } from 'material-ui'
import { List, ListItem } from 'material-ui/List'
import { Card, CardActions, CardHeader, CardMedia, CardTitle, CardText } from 'material-ui/Card'
import { Tabs, Tab } from 'material-ui/Tabs'
import { FloatingActionButton, IconButton, FlatButton, RaisedButton, Toggle, CircularProgress } from 'material-ui'

import IconAVPlayArrow from 'material-ui/svg-icons/av/play-arrow'
import IconAVStop from 'material-ui/svg-icons/av/stop'

// import reactClickOutside from 'react-click-outside'

import { LabeledText, Spacer } from './CustomViews'
import { dispatch, dockerStore, dockerState, taskStates, installedStore } from '../utils/storeState'

const buttonDisabled = {

  created: {
      start: false,
      stop: true,
      restart: true
    },
  running: {
      start: true,
      stop: false,
      restart: false
    },
  restarting: {
      start: true,
      stop: true,
      restart: true,
    },
  paused: {
      notUsed: 0
    },
  exited: {
      start: false,
      stop: true,
      restart: true
    }
}

// TODO
const requesting = (operation, args) => {

  let req = dockerStore().request
  if (!req || !req.operation) return false

  if (req.operation === operation &&
      req.args[0] === arg0) return true
  return false
}

const containerStartingMe = (container) => {
  
  let { request } = dockerStore()
  return (request && 
          request.operation && 
          request.operation.operation === 'containerStart' && 
          request.operation.args[0] && 
          request.operation.args[0] === container.Id)
}

const installedStartingMe = (installed) => {

  let { request } = dockerStore()
  return (request &&
          request.operation &&
          request.operation.operation === 'installedStart' &&
          request.operation.args[0] &&
          request.operation.args[0] === installed.uuid)
}

const containerStoppingMe = (container) => {

  let { request } = dockerStore()
  return (request && 
          request.operation &&
          request.operation.operation === 'containerStop' && 
          request.operation.args[0] && 
          request.operation.args[0] === container.Id)
}

const installedStoppingMe = (installed) => {

  let { request } = dockerStore()
  return (request &&
          request.operation &&
          request.operation.operation === 'installedStop' &&
          request.operation.args[0] &&
          request.operation.args[0] === installed.uuid)
}

const containerRunning = (container) => {
 
}

const containerButtonStyle = {
    width: 92,
    height: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center' 
}

const BusyFlatButton = ({ busy, label, disabled, onTouchTap }) => {

  if (busy)
    return <div style={containerButtonStyle}><CircularProgress size={0.5} /></div>
  
  return <div style={containerButtonStyle}><FlatButton label={label} disabled={disabled} onTouchTap={onTouchTap} /></div> 
}

const OpenButton = ({container}) => {

  const openable = (container) =>
    ( container.State === 'running' &&
      container.Ports.length &&
      container.Ports[0].Type === 'tcp' &&
      container.Ports[0].PublicPort) 


  if (!openable(container)) return <div style={containerButtonStyle} /> 

  let url = `http://${window.location.hostname}:${container.Ports[0].PublicPort}`
  let onOpen = () => window.open(url) 

  return (
    <div style={containerButtonStyle}>
      <FlatButton label="open" primary={true} onTouchTap={ onOpen } />
    </div>
  )
}

const renderHeaderLeft = (avatar, title, text, onClick) => {
  let style = { height: '100%', flexGrow:1, display: 'flex', alignItems: 'center', padding:8 }
  return (
    <div style={style} onClick={onClick} >
      <Avatar style={{marginLeft:8, marginRight:24}} src={avatar} />
      <div style={{fontSize:20, opacity:0.87, width:200}}>{title}</div>
      <div style={{fontSize:15, opacity:0.54}}>{text}</div>
    </div>
  )
}

const renderContainerHeaderRight = (container) => {

  let startButtonTap = () => 
    dispatch({
      type: 'DOCKER_OPERATION',
      operation: {
        operation: 'containerStart',
        args: [container.Id]
      }
    })

  let stopButtonTap = () => 
    dispatch({
      type: 'DOCKER_OPERATION',
      operation: {
        operation: 'containerStop',
        args: [container.Id]
      }
    })

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding:8 }}> 
      <BusyFlatButton busy={containerStartingMe(container)} label="start" disabled={buttonDisabled[container.State].start} 
        onTouchTap={startButtonTap} />
      <BusyFlatButton busy={containerStoppingMe(container)} label="stop" disabled={buttonDisabled[container.State].stop} 
        onTouchTap ={stopButtonTap} />
      <OpenButton container={container} /> 
    </div>
  )
}

const renderContainerCardHeader = (container) => {

  let avatar = 'http://lorempixel.com/100/100/nature/'
  let onClick = () => {
    let select = installedStore().select
    if (select && select.type === 'container' && select.id === container.Id) {
      dispatch({type: 'INSTALLED_DESELECT'})
    }
    else {
      dispatch({
        type: 'INSTALLED_SELECT',
        select: {
          type: 'container',
          id: container.Id
        }
      })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      { renderHeaderLeft(avatar, container.Image, container.Status, onClick) }
      { renderContainerHeaderRight(container) }
    </div>
  ) 
}

// TODO this function may be implemented in backend
const installedMainContainer = (installed) => {

  let containers = dockerState().containers
  let compo = installed.recipe.components[0]
  let image = `${compo.namespace}/${compo.name}`
  return containers.filter(c => installed.containerIds.find(id => id === c.Id))
          .find(c => c.Image === image)
}

const renderInstalledHeaderRight = (installed) => {

  let startButtonTap = () => 
    dispatch({
      type: 'DOCKER_OPERATION',
      operation: {
        operation: 'installedStart',
        args: [installed.uuid]
      }
    })

  let stopButtonTap = () => 
    dispatch({
      type: 'DOCKER_OPERATION',
      operation: {
        operation: 'installedStop',
        args: [installed.uuid]
      }
    })

  let container = installedMainContainer(installed)
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding:8 }}> 
      <BusyFlatButton busy={installedStartingMe(installed)} label="start" disabled={buttonDisabled[container.State].start} 
        onTouchTap={startButtonTap} />
      <BusyFlatButton busy={installedStoppingMe(installed)} label="stop" disabled={buttonDisabled[container.State].stop} 
        onTouchTap ={stopButtonTap} />
      <OpenButton container={container} /> 
    </div>
  )
}

const renderInstalledCardHeader = (installed) => {

  let avatar = `/images/${installed.recipe.components[0].imageLink}`
  let onClick = () => {
    let select = installedStore().select
    if (select && select.type === 'installed' && select.id === installed.uuid) {
      dispatch({type: 'INSTALLED_DESELECT'})
    }
    else {
      dispatch({
        type: 'INSTALLED_SELECT',
        select: {
          type: 'installed',
          id: installed.uuid
        }
      })
    }
  }

  let container = installedMainContainer(installed)
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      { renderHeaderLeft(avatar, installed.recipe.appname, container.Status, onClick) }
      { renderInstalledHeaderRight(installed) }
    </div>
  ) 
}

const renderContainerCardContent = (container) => {

  let ccdRowStyle = { width: '100%', display: 'flex', flexDirection: 'row', }
  let ccdLeftColStyle = { flex: 1, fontSize: 15, opacity:0.87 }
  let ccdRightColStyle = { flex: 3 }

  return (
    <div style={{padding:16}}>
      <div style={ccdRowStyle}>
        <div style={ccdLeftColStyle}>{container.Image}</div>
        <div style={ccdRightColStyle}>
          <LabeledText label='container name' text={container.Names[0].slice(1)} right={4}/>
          <LabeledText label='container id' text={container.Id} right={4}/>
          <LabeledText label='image' text={container.Image} right={4}/>
          <LabeledText label='image id' text={container.ImageID.slice(7)} right={4}/>
          <LabeledText label='state' text={container.State} right={4}/>
          <LabeledText label='status' text={container.Status} right={4}/>
        </div>
      </div>
    </div>
  )
}

const renderContainerCardFooter = (container) => {

  let onTouchTap = () => {
    dispatch({
      type: 'DOCKER_OPERATION',
      operation: {
        operation: 'containerDelete',
        args: [container.Id]
      }
    })  
  }

  return (
    <div style={{padding:8}}>
      <FlatButton label="uninstall" onTouchTap = {onTouchTap} />
    </div>
  )  
}

const renderContainerCard = (container) => {

  let deselected = { width: '98%', marginTop: 0, marginBottom: 0 }
  let selected = { width: '100%', marginTop: 24, marginBottom: 24 }

  let select = installedStore().select
  let me = (select && select.type === 'container' && select.id === container.Id)

  return (
    <Paper style={ me ? selected : deselected } key={container.Id} rounded={false} zDepth={ me ? 2 : 0 } >
      { renderContainerCardHeader(container) }
      { me && renderContainerCardContent(container) } 
      { me && renderContainerCardFooter(container) }
    </Paper>
  )
}

const renderInstalledCard = (installed) => {

  let deselected = { width: '98%', marginTop: 0, marginBottom: 0 }
  let selected = { width: '100%', marginTop: 24, marginBottom: 24 }

  let select = installedStore().select
  let me = (select && select.type === 'installed' && select.id === installed.uuid)

  let container = installedMainContainer(installed)
  return (
    <Paper style={ me ? selected : deselected } key={installed.uuid} rounded={false} zDepth={ me ? 2 : 1 } >
      { renderInstalledCardHeader(installed) }
      { me && (<Divider />) }
      { me && renderContainerCardContent(container) }
    </Paper>
  ) 
}

const renderInstallingHeaderLeft = (avatar, title, onClick) => {

  let style = { height: '100%', flexGrow:1, display: 'flex', alignItems: 'center', padding:8 }
  return (
    <div style={style} onClick={onClick} >
      <Avatar style={{marginLeft:8, marginRight:24}} src={avatar} />
      <div style={{fontSize:14, fontWeight:600, width:200, opacity:0.87}}>{title}</div>
      <div style={{fontSize:14, fontWeight:300, width:200, opacity:0.54}}>Installing</div>
      <LinearProgress mode='indeterminate' color='red' />
    </div>
  )
}

const renderInstallingHeaderRight = (task) => {

  let stopButtonTap = () => 
    dispatch({
      type: 'DOCKER_OPERATION',
      operation: {
        operation: 'containerStop',
        args: [task.uuid]
      }
    })

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding:8 }}> 
      <BusyFlatButton busy={false} label="stop" disabled={true} 
        onTouchTap ={stopButtonTap} />
    </div>
  )
}

const renderInstallingCardHeader = (task) => {

  let avatar = `/images/${task.recipe.components[0].imageLink}`
  let onClick = () => {
    let select = installedStore().select
    if (select && select.type === 'installed' && select.id === task.uuid) {
      dispatch({type: 'INSTALLED_DESELECT'})
    }
    else {
      dispatch({
        type: 'INSTALLED_SELECT',
        select: {
          type: 'installed',
          id: task.uuid
        }
      })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      { renderInstallingHeaderLeft(avatar, task.recipe.appname, onClick) }
      { renderInstallingHeaderRight(task) }
    </div>
  ) 
}

const renderInstallingCardContentJob = (compo, job) => {

  let threadText = (t) => {
    if (t.progress) {
      let {current, total} = t.progressDetail
      return `${t.status} ( ${current} / ${total} )`
    } 
    return t.status
  }

  let ccdRowStyle = { width: '100%', display: 'flex', flexDirection: 'row', }
  let ccdLeftColStyle = { flex: 1, fontSize: 24, fontWeight: 500, opacity:0.54 }
  let ccdRightColStyle = { flex: 3 }

  return (
    <div style={ccdRowStyle}>
      <div style={ccdLeftColStyle}>{compo.name}</div>
      <div style={ccdRightColStyle}>
        { job.image.threads && job.image.threads.map(t => <LabeledText label={t.id} text={threadText(t)} right={4} />) }
        {/*
        <LabeledText label='container name' text={container.Names[0].slice(1)} right={4}/>
        <LabeledText label='container id' text={container.Id} right={4}/>
        <LabeledText label='image' text={container.Image} right={4}/>
        <LabeledText label='image id' text={container.ImageID.slice(7)} right={4}/>
        <LabeledText label='state' text={container.State} right={4}/>
        <LabeledText label='status' text={container.Status} right={4}/>
        */}
      </div>
    </div>
  )
}

const renderInstallingCardContent = (task) => {

  return (
    <div style={{padding:16}}>
      { task.jobs.map((j, index) => renderInstallingCardContentJob(task.recipe.components[index], j)) }
    </div>
  )
}

 

const renderInstallingCard = (task) => {

  let deselected = { width: '98%', marginTop: 0, marginBottom: 0 }
  let selected = { width: '100%', marginTop: 24, marginBottom: 24 }

  let select = installedStore().select
  let me = (select && select.type === 'installed' && select.id === task.uuid)

  return (
    <Paper style={ me ? selected : deselected } key={task.uuid} rounded={false} zDepth={ me ? 2 : 1 } >
      { renderInstallingCardHeader(task) }
      { me && (<Divider />) }
      { me && renderInstallingCardContent(task) }
    </Paper>
  ) 
}

/******************************************************************************

  Three elements renders in this page

  1) installing task + no containers
  2) installing task + partly installed containers (transient)
  3) installed task success + all installed containers
  4) installed task failed + partly installed containers
  5) unmanaged containers (orphan)

  in case 2, 3, and 4, there would be a matching uuid between installeds and tasks

  case 3/4 should be considered as truly-installed (properInstalleds)
  case 2 shoudl be considered as installing

*******************************************************************************/

const getInstallingTasks = () => taskStates().filter(t => t.type === 'appInstall' && t.status ==='started')

const getProperInstalleds = () => {
  
  let { installeds } = dockerState()
  let tasks = getInstallingTasks()

  return installeds.filter(inst => 
    undefined === tasks.find(t => t.uuid === inst.uuid))
}

const getOrphanContainers = () => {

  let { installeds, containers } = dockerState()

  let installedContainerIds = 
    installeds.reduce((prev, inst) => 
      [...prev, ...inst.containerIds], [])

  let orphans = containers.filter(c => !installedContainerIds.find(i => i === c.Id)) 
  return orphans
}

const PAGEKEY = 'installed-apps-list'

const renderMyAppsPage = () => {

  let docker = dockerState()
  if (docker === null) {      
    // TODO
    return <div /> 
    return <div key={PAGEKEY}><CircularProgress size={1} /></div>
  }

  let installeds = docker.installeds
  let containers = docker.containers
  
  // TODO marginLeft not accurate
  return (
    <div key={PAGEKEY}>
      {/* <div style={{ fontSize:14, marginLeft:30 }} >Installing</div> */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop:0 }}>
        { getInstallingTasks().map(renderInstallingCard) }
        { getProperInstalleds().map(renderInstalledCard) }
        { getOrphanContainers().map(renderContainerCard) }
      </div>
    </div>
  ) 
}

export default renderMyAppsPage


