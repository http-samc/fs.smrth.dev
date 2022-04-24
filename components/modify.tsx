import { AutoComplete, Divider, Modal, Select, useToasts, Text, Input } from "@geist-ui/core"
import { useState } from "react"
import Cookie from 'js-cookie'

interface Props {
    visible: boolean,
    toggleVisibility: () => void,
    hints: string[],
    id: string,
    onModalClose: () => void
}

const Modify = (props: Props) => {

    const [isModifying, setIsModifying] = useState(false)
    const [options, setOptions] = useState<any>([])
    const [fileVisibility, setFileVisibility] = useState("private")
    const [path, setPath] = useState("")
    const [fileName, setFileName] = useState("")
    const { setToast } = useToasts()

    const autoCompleteOptions = props.hints.map(path => {
        return {
            value: path,
            label: path
        }
    })

    const searchHandler = (currentValue: string) => {
        if (!currentValue) return setOptions([])
        // @ts-ignore
        const relatedOptions = autoCompleteOptions.filter(item => item.value.includes(currentValue))
        setOptions(relatedOptions)
    }

    const closeModal = () => {
        setIsModifying(false)
        setOptions([])
        setFileVisibility("private")
        setFileName("")
        setPath("")
        props.onModalClose()
        props.toggleVisibility()
    }

    const onModify = () => {
        if (!fileName || !fileName.includes('.')) {
            setToast({ text: "Warning: Valid File Name Required", type: "warning" })
            return;
        }

        setIsModifying(true)

        fetch(`/api/modify?to=${fileVisibility}/${path ? path + '/' : ''}${fileName}&from=${props.id}`)
            .then(res => res.status == 200 ? res.json() : null)
            .then(res => {
                console.log(res)
                if (res) {
                    setToast({ text: "Successfully Modified File", type: "success" })
                }
                else {
                    setToast({ text: "Error: File Modification Failed", type: "error" })
                }
                setIsModifying(false)
                closeModal()
            })
    }

    return (
        <Modal visible={props.visible} height={22}>
            <Modal.Title>Modify File</Modal.Title>
            <Divider />
            <Modal.Content className='upload-container' height={13}>
                <Input
                    width='100%'
                    placeholder='File Name'
                    initialValue={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                />
                <AutoComplete
                    width='100%'
                    placeholder="Path"
                    options={options}
                    onSearch={searchHandler}
                    value={path}
                    onChange={(text) => setPath(text.split('/').filter(i => !!i).join('/'))}
                >
                    <AutoComplete.Empty>
                        <Text>No suggestions.</Text>
                    </AutoComplete.Empty>
                </AutoComplete>
                <Select
                    width='100%'
                    initialValue='private'
                    value={fileVisibility}
                    onChange={(e) => setFileVisibility(e.toString())}
                >
                    <Select.Option value="private">Private</Select.Option>
                    <Select.Option value="public">Public</Select.Option>
                    <Select.Option value="global">Global</Select.Option>
                </Select>
            </Modal.Content>
            <Modal.Action passive onClick={closeModal}>Cancel</Modal.Action>
            <Modal.Action onClick={onModify} loading={isModifying}>Update</Modal.Action>
        </Modal>
    )
}

export default Modify