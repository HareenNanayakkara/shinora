

<?php
$subject = 'You Got Message'; // Subject of your email
$to = 'shinoraaustralia@gmail.com';  //Recipient's E-mail
$emailTo = $_REQUEST['email'];

$name = $_REQUEST['Name'];
$email = $_REQUEST['Email'];
$phone = $_REQUEST['phone'];
$msg = $_REQUEST['message'];


$email_from = $name.'<'.$email.'>';

$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/plain;charset=UTF-8" . "\r\n";
$headers .= "From: $name <$email>" . "\r\n";
$headers .= "Return-Path:"."From:" . $email;

$message .= 'Name : ' . $name . "\n";
$message .= 'Email : ' . $email . "\n";
$message .= 'Phone : ' . $phone . "\n";
$message .= 'Message : ' . $msg;

$message_body = "Name: $name\nEmail: $email\nPhone: $phone\nMessage: $msg";

if(mail($to, $subject, $message_body, $headers)) {
    echo 'sent';
} else {
    echo 'failed';
}

// if (@mail($to, $subject, $message, $email_from))
// {
// 	// Transfer the value 'sent' to ajax function for showing success message.
// 	echo 'sent';
// }
// else
// {
// 	// Transfer the value 'failed' to ajax function for showing error message.
// 	echo 'failed';
// }
?>
