import { Button, Tree, Text, Fieldset, Divider, Loading, Spacer, useToasts } from '@geist-ui/core'
import { ChevronDown, ChevronsDown, ChevronsUp, Copy, Edit, Eye, Plus, RefreshCcw, Trash2 } from '@geist-ui/icons'
import { useEffect, useState } from 'react'
import Delete from '../components/delete'
import Modify from '../components/modify'
import Upload from '../components/upload'
import formatBytes from '../utils/format-bytes'
import getRelativeTime from '../utils/get-relative-time'

interface Document {
  document: string,
  modified: string,
  visibility: string,
  size: number,
}

interface Props {
  currentUser: string
}

let i = 'open';

const Home = (props: Props) => {
  const [uploadModalIsVisible, setUploadModalIsVisible] = useState(false)
  const [deleteModalIsVisible, setDeleteModalIsVisible] = useState(false)
  const [modifyModalIsVisible, setModifyModalIsVisible] = useState(false)
  const [treeExpanded, setTreeExpanded] = useState(false)
  const [updated, setUpdated] = useState(0)
  const [fileTree, setFileTree] = useState([])
  const [hints, setHints] = useState<string[]>([])
  const [recentFileID, setRecentFileID] = useState("")
  const [loading, setLoading] = useState(true)
  const { setToast } = useToasts()

  const getFiles = async () => {
    setLoading(true)
    setUpdated(Date.now())

    const res = await fetch('/api/list-tree')
    const data: Document[] = await res.json()
    if (!data.length) {
      setFileTree([])
      setLoading(false)
      return;
    }

    let tree: any = []
    let tempHints: string[] = []

    for (const doc of data) {
      let path = doc.document.split('/')
      let docName = path.pop()

      if (path.length > 0 && !tempHints.includes(path.join('/'))) {
        tempHints.push(path.join('/'))
      }

      path.splice(0, 0, doc.visibility)

      let idx = 0
      let current = tree
      let inserted = false

      while (!inserted) {
        let target = path[idx]
        let foundAtLevel = false
        for (let elem of current) {
          if (elem.type === 'directory' && elem.name === target) {
            foundAtLevel = true
            current = elem.files
            break
          }
        }
        if (!foundAtLevel) {
          current.push({
            type: 'directory',
            name: target,
            files: []
          })
          current = current[current.length - 1].files
        }
        if (idx < path.length - 1) {
          idx++
        }
        else {
          current.push({
            type: 'file',
            name: docName,
            extra: `${formatBytes(doc.size, 0)} (${getRelativeTime(doc.modified)})`,
          })
          inserted = true
        }
      }
      setFileTree(tree)
    }

    setHints(tempHints)
    setLoading(false)
  }

  const handleFileAction = (id: string) => {
    setRecentFileID(id)

    if (i === 'copy') {
      window.navigator.clipboard.writeText(`https://${window.location.host}/${props.currentUser}/${id}`)
      let vis = id.split('/')[0]
      let statement;
      if (vis === 'private') {
        statement = 'This link only works for you.'
      }
      else if (vis === 'public') {
        statement = 'Anyone authenticated can use this link.'
      }
      else {
        statement = 'This link works for anyone.'
      }

      setToast({
        text: 'Copied link to clipboard! ' + statement,
        type: 'success'
      })
    }
    else if (i === 'open') {
      window.open(`/${props.currentUser}/${id}`)
    }
    else if (i === 'delete') {
      setDeleteModalIsVisible(true)
    }
    else if (i == 'modify') {
      setModifyModalIsVisible(true)
    }
  }

  const toggleTreeExpanded = () => {
    if (!fileTree.length) return;
    setTreeExpanded(!treeExpanded)
    getFiles()
  }

  const toggleUploadModal = () => {
    setUploadModalIsVisible(!uploadModalIsVisible)
  }

  const toggleDeleteModal = () => {
    setDeleteModalIsVisible(!deleteModalIsVisible)
  }

  const toggleModifyModal = () => {
    setModifyModalIsVisible(!modifyModalIsVisible)
  }

  useEffect(() => {
    getFiles()
  }, [])

  return (
    <div className='home-container'>
      <Upload visible={uploadModalIsVisible} toggleVisibility={toggleUploadModal} hints={hints} onModalClose={getFiles} />
      <Modify visible={modifyModalIsVisible} toggleVisibility={toggleModifyModal} id={recentFileID} hints={hints} onModalClose={getFiles} />
      <Delete visible={deleteModalIsVisible} toggleVisibility={toggleDeleteModal} id={recentFileID} onModalClose={getFiles} />
      <Spacer h={1.25} />
      <Fieldset height='100%' style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <Fieldset.Content className='header-container'>
            <div style={{ width: 240, marginTop: 7 }} className='header-options'>
              <Button onClick={toggleUploadModal} icon={<Plus />} auto>Upload</Button>
              <Button icon={treeExpanded ? <ChevronsUp /> : <ChevronsDown />} onClick={toggleTreeExpanded} auto />
              <Button icon={<RefreshCcw />} onClick={getFiles} auto />
            </div>
            <div style={{ width: 240, marginTop: 7 }} className='header-container'>
              <Button icon={<Copy />} onClick={() => { i = 'copy'; setToast({ text: 'Mode: Copying Link', type: 'secondary' }) }} auto ghost type="secondary" />
              <Button icon={<Eye />} onClick={() => { i = 'open'; setToast({ text: 'Mode: Opening File', type: 'success' }) }} auto ghost type="success" />
              <Button icon={<Edit />} onClick={() => { i = 'modify'; setToast({ text: 'Mode: Modifying File', type: 'warning' }) }} auto ghost type="warning" />
              <Button icon={<Trash2 />} onClick={() => { i = 'delete'; setToast({ text: 'Mode: Deleting File', type: 'error' }) }} auto ghost type="error" />
            </div>
          </Fieldset.Content>
          <Divider my={0} />
        </div>
        <Fieldset.Content height='100%'>
          {
            loading
              ? <Loading type='success' />
              : <Tree value={fileTree} initialExpand={treeExpanded} onClick={id => handleFileAction(id)} />
          }
          {
            !loading && !fileTree.length &&
            <Text small>No files stored. Upload to get started.</Text>
          }
        </Fieldset.Content>
        <Fieldset.Footer>
          <Text small>Last Updated: {new Date(updated).toUTCString()}</Text>
        </Fieldset.Footer>
      </Fieldset>
    </div>
  )
}


export default Home;
