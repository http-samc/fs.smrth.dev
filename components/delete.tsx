import { AutoComplete, Divider, Modal, Select, useToasts, Text } from "@geist-ui/core"
import { useState } from "react"

interface Props {
    visible: boolean,
    toggleVisibility: () => void,
    id: string,
    onModalClose: () => void
}

const Delete = (props: Props) => {
    const [isDeleting, setIsDeleting] = useState(false)
    const { setToast } = useToasts()

    const closeModal = () => {
        setIsDeleting(false)
        props.onModalClose()
        props.toggleVisibility()
    }

    const onDelete = () => {
        setIsDeleting(true)
        fetch('/api/delete?' + new URLSearchParams({ id: props.id }))
            .then(res => res.status == 200 ? res.json() : null)
            .then(res => {
                if (res) {
                    setToast({ text: "Successfully Deleted File", type: "success" })
                }
                else {
                    setToast({ text: "Error: File Delete Failed", type: "error" })
                }
                closeModal()
            })
    }


    return (
        <Modal visible={props.visible} height={22}>
            <Modal.Title>Delete File</Modal.Title>
            <Divider />
            <Modal.Content className='upload-container' height={13}>
                <Text>Are you sure you want to permanently delete {props.id}?</Text>
                <Text type="warning">This action is irreversible.</Text>
            </Modal.Content>
            <Modal.Action passive onClick={closeModal}>Cancel</Modal.Action>
            <Modal.Action onClick={onDelete} loading={isDeleting}>Delete</Modal.Action>
        </Modal>
    )
}

export default Delete