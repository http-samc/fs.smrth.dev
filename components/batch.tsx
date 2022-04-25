import { AutoComplete, Divider, Modal, Select, useToasts, Text, Input } from "@geist-ui/core"
import { useState } from "react"
import Cookie from 'js-cookie'

interface Props {
    visible: boolean,
    toggleVisibility: () => void,
    hints: string[],
    onModalClose: () => void
}

const VISIBILITIES = ["private", "public", "global"]

const Batch = (props: Props) => {

    const [isActing, setIsActing] = useState(false)
    const [options, setOptions] = useState<any>([])
    const [action, setAction] = useState("move")
    const [path, setPath] = useState("")
    const [movePath, setMovePath] = useState("")
    const [deletePath, setDeletePath] = useState("")
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
        setIsActing(false)
        setOptions([])
        setAction("move")
        setPath("")
        setMovePath("")
        setDeletePath("")
        props.onModalClose()
        props.toggleVisibility()
    }

    const takeAction = async () => {
        if (path === "") {
            setToast({ text: "Please enter a valid batch path", type: "warning" })
            return;
        }
        if (action === "delete" && deletePath !== path) {
            setToast({ text: "Please correctly confirm the delete batch", type: "warning" })
            return;
        }
        if (action == 'move' && (!movePath.split('/').length || !VISIBILITIES.includes(movePath.split('/')[0]))) {
            setToast({ text: "Valid visibility required", type: "warning" })
            return;
        }

        setIsActing(true)

        if (action === 'delete') {
            const res = await fetch(`/api/delete?id=${path}&batchAction=true`)
            res.status == 200
                ? setToast({ text: "Batch deleted successfully", type: "success" })
                : setToast({ text: "Batch deletion failed", type: "error" })
        }

        else if (action === 'move') {
            const res = await fetch(`/api/modify?to=${movePath}&from=${path}&batchAction=true`)
            res.status == 200
                ? setToast({ text: "Batch moved successfully", type: "success" })
                : setToast({ text: "Batch move failed", type: "error" })
        }

        closeModal()
    }

    return (
        <Modal visible={props.visible} height={22}>
            <Modal.Title>Batch Action</Modal.Title>
            <Divider />
            <Modal.Content className='upload-container' height={13}>
                <Select
                    width='100%'
                    initialValue='move'
                    value={action}
                    onChange={(e) => setAction(e.toString())}
                >
                    {/* <Select.Option value="download">Download</Select.Option> */}
                    <Select.Option value="move">Move</Select.Option>
                    <Select.Option value="delete">Delete</Select.Option>
                </Select>
                <AutoComplete
                    width='100%'
                    disableFreeSolo
                    placeholder="Select batch..."
                    options={options}
                    onSearch={searchHandler}
                    value={path}
                    onChange={(text) => setPath(text.split('/').filter(i => !!i).join('/'))}
                >
                    <AutoComplete.Empty>
                        <Text>No suggestions.</Text>
                    </AutoComplete.Empty>
                </AutoComplete>
                {
                    action === "move" &&
                    <AutoComplete
                        width='100%'
                        placeholder="Move to..."
                        options={options}
                        onSearch={searchHandler}
                        value={movePath}
                        onChange={(text) => setMovePath(text.split('/').filter(i => !!i).join('/'))}
                    >
                        <AutoComplete.Empty>
                            <Text>No suggestions.</Text>
                        </AutoComplete.Empty>
                    </AutoComplete>
                }
                {
                    action === "delete" &&
                    <Input
                        width='100%'
                        placeholder={`Enter '${path}' to confirm deletion`}
                        value={deletePath}
                        onChange={(e) => setDeletePath(e.target.value)}
                    />
                }

            </Modal.Content>
            <Modal.Action passive onClick={closeModal}>Cancel</Modal.Action>
            <Modal.Action onClick={takeAction} loading={isActing}>Confirm</Modal.Action>
        </Modal>
    )
}

export default Batch