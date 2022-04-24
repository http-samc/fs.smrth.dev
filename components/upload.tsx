import { AutoComplete, Divider, Modal, Select, useToasts, Text } from "@geist-ui/core"
import { useState } from "react"

interface Props {
    visible: boolean,
    toggleVisibility: () => void,
    hints: string[],
    onModalClose: () => void
}

const Upload = (props: Props) => {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [options, setOptions] = useState<any>([])
    const [fileVisibility, setFileVisibility] = useState("private")
    const [path, setPath] = useState("")
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
        setFile(null)
        setOptions([])
        setIsUploading(false)
        setPath("")
        setFileVisibility("private")
        props.onModalClose()
        props.toggleVisibility()
    }

    const onUpload = () => {
        if (!file) {
            setToast({ text: "Error: No file selected", type: "error" })
            return;
        }

        setIsUploading(true)

        const formData = new FormData()
        formData.append('file', file || '')
        formData.append('visibility', fileVisibility)
        formData.append('path', path
            .split('/')
            .filter(i => !!i)
            .join('/')
        )
        fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })
            .then(res => res.status == 200 ? res.json() : null)
            .then(res => {
                if (res) {
                    setToast({ text: "Successfully Uploaded File", type: "success" })
                }
                else {
                    setToast({ text: "Error: File Upload Failed", type: "error" })
                }
                setIsUploading(false)
                closeModal()
            })
    }


    return (
        <Modal visible={props.visible} height={22}>
            <Modal.Title>Create File Upload</Modal.Title>
            <Divider />
            <Modal.Content className='upload-container' height={13}>
                {/* @ts-ignore */}
                <input width='100%' type="file" onChange={(e) => setFile(e.target.files[0])} />
                <AutoComplete
                    width='100%'
                    placeholder="Path"
                    options={options}
                    onSearch={searchHandler}
                    onChange={(text) => setPath(text.split('/').filter(i => !!i).join('/'))}
                >
                    <AutoComplete.Empty>
                        <Text>No suggestions.</Text>
                    </AutoComplete.Empty>
                </AutoComplete>
                <Select
                    width='100%'
                    initialValue="private"
                    onChange={(e) => setFileVisibility(e.toString())}
                >
                    <Select.Option value="private">Private</Select.Option>
                    <Select.Option value="public">Public</Select.Option>
                    <Select.Option value="global">Global</Select.Option>
                </Select>
            </Modal.Content>
            <Modal.Action passive onClick={closeModal}>Cancel</Modal.Action>
            <Modal.Action onClick={onUpload} loading={isUploading}>Upload</Modal.Action>
        </Modal>
    )
}

export default Upload