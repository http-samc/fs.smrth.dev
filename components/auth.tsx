import { Text, Card, ButtonGroup, Button, Spacer, Input, Divider } from "@geist-ui/core";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { useToasts } from "@geist-ui/core";
import Cookies from 'js-cookie'

interface Props {
    onAuthFinished: (username: string) => void
}

const Auth = (props: Props) => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [isSigningUp, setIsSigningUp] = useState(false)
    const { setToast } = useToasts()

    const onSignIn = async () => {
        setIsAuthenticating(true)
        const res = await fetch('/api/auth', {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password
            })
        })
        if (res.status !== 200) {
            setToast({
                text: await res.text(),
                type: "error"
            })
            setIsAuthenticating(false)
            return
        }
        const data = await res.json()
        Cookies.set('authorization', data.token, { expires: 1 })
        setIsAuthenticating(false)
        setToast({ text: "Signed In!", type: "success" })
        props.onAuthFinished(username)
    }

    const onSignUp = async () => {
        setIsSigningUp(true)
        const res = await fetch('/api/create-user', {
            method: 'POST',
            body: JSON.stringify({
                username,
                password
            })
        })
        if (res.status == 200) {
            setToast({ text: "Signed Up!", type: "success" })
            onSignIn()
        }
        else {
            setToast({ text: await res.text(), type: "error" })
        }
        setIsSigningUp(false)
    }

    return (
        <div className="auth-container">
            <Card width='300px'>
                <Text h3 style={{ width: '100%', textAlign: 'center' }}>Authenticate</Text>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 80 }}>
                    <Input
                        placeholder="Username"
                        width='100%'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <Input.Password
                        placeholder="Password"
                        width='100%'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <Card.Footer style={{ display: "flex", justifyContent: 'center' }}>
                    <Button
                        width='100px'
                        type="success"
                        loading={isAuthenticating}
                        onClick={onSignIn}
                    >
                        Sign In
                    </Button>
                    <Spacer w={0.5} />
                    <Button
                        width='100px'
                        type="warning"
                        loading={isSigningUp}
                        onClick={onSignUp}
                    >
                        Sign Up
                    </Button>
                </Card.Footer>
            </Card>
        </div>
    )
}

export default Auth