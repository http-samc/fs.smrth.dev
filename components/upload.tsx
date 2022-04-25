import { AutoComplete, Divider, Modal, Select, useToasts, Text, Radio, Spacer } from "@geist-ui/core"
import { useEffect, useRef, useState } from "react"

interface Props {
    visible: boolean,
    toggleVisibility: () => void,
    hints: string[],
    onModalClose: () => void
}

const Upload = (props: Props) => {
    const [files, setFiles] = useState<FileList | null>(null)
    const [uploadType, setUploadType] = useState<"files" | "directory">("files")
    const [isUploading, setIsUploading] = useState(false)
    const [options, setOptions] = useState<any>([])
    const [fileVisibility, setFileVisibility] = useState("private")
    const [path, setPath] = useState("")
    const ref = useRef<HTMLInputElement>(null)
    const { setToast } = useToasts()

    const autoCompleteOptions = props.hints.map(p => {
        let path = p.split('/').slice(1).join('/')
        return {
            value: path,
            label: path
        }
    })

    useEffect(() => {
        if (ref.current !== null && uploadType === "directory") {
            ref.current.setAttribute("directory", "")
            ref.current.setAttribute("webkitdirectory", "")
        }
        else if (ref.current !== null) {
            ref.current.removeAttribute("directory")
            ref.current.removeAttribute("webkitdirectory")
        }
    }, [uploadType])

    const searchHandler = (currentValue: string) => {
        if (!currentValue) return setOptions([])
        // @ts-ignore
        const relatedOptions = autoCompleteOptions.filter(item => item.value.includes(currentValue))
        setOptions(relatedOptions)
    }

    const closeModal = () => {
        setFiles(null)
        setOptions([])
        setIsUploading(false)
        setPath("")
        setFileVisibility("private")
        props.onModalClose()
        props.toggleVisibility()
    }

    const onUpload = () => {
        if (!files) {
            setToast({ text: "Error: No file selected", type: "error" })
            return;
        }

        let basePath = path
            .split('/')
            .filter(i => !!i)
            .join('/')

        let filePaths: any = {}

        setIsUploading(true)

        const formData = new FormData()
        for (let i in files) {
            formData.append("file" + i, files[i])
            if (files[i].webkitRelativePath) {
                let relativePath = files[i].webkitRelativePath
                    .split('/')
                    .slice(0, -1)
                    .join('/')
                filePaths["file" + i] = (basePath ? basePath + '/' : '') + relativePath
            }
            else {
                filePaths["file" + i] = basePath
            }
        }

        formData.append('visibility', fileVisibility)
        formData.append('paths', JSON.stringify(filePaths))
        fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })
            .then(res => res.status == 200 ? res.json() : null)
            .then(res => {
                if (res) {
                    setToast({ text: "Successfully Uploaded", type: "success" })
                }
                else {
                    setToast({ text: "Error: Upload Failed", type: "error" })
                }
                setIsUploading(false)
                closeModal()
            })
    }


    return (
        <Modal visible={props.visible} height={22}>
            <Modal.Title>Create Upload</Modal.Title>
            <Divider />
            <Modal.Content className='upload-container' height={13}>
                <Radio.Group value="1" useRow width='100%' style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Text b id="upload-type">Upload Type</Text>
                    <Spacer width={.5} />
                    <Radio value="1" onChange={() => setUploadType("files")}>Files</Radio>
                    <Radio value="2" onChange={() => setUploadType("directory")}>Directory</Radio>
                </Radio.Group>
                {/* @ts-ignore */}
                <input width='100%' type="file" onChange={(e) => setFiles(e.target.files)} ref={ref} multiple />
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