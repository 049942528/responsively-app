const User=require('../model/user.model')
const Subscription=require('../model/subscription.model')
const userService=require('../service/user.service')
const planService=require('../service/plan.service')
const constants=require('../constants/constants')
const emailService=require('../service/email.service')
const InvalidLicenseError=require('../exception/invalid-license-error.exception')
const UserExistsError=require('../exception/user-exists-error.exception')

async function createUserAndActivateTrial(email){

    try{
        if(await userService.checkIfUserExists(email)){
            throw new UserExistsError('User exists')
        }
        let user=await userService.createUser(email, null)
    
        let subscription=new Subscription({
            user_id: user._id,
            plan_id: constants.TRIAL_PLAN_ID,
            end_date: getTrialEndDate(new Date()),
            status: constants.SUBSCRIPTION_STATUS.ACTIVE.id,
            quantity: 1,
            c_ts: new Date(),
            u_ts: new Date()
        })
        await insertSubscription(subscription)
        await emailService.sendLicenseKeyMail(email,user.license_key)
    }catch(err){
        console.log(err)
        throw err
    }
}

function getTrialEndDate(startDate){
    let endDate=new Date(startDate)
    endDate.setMonth(endDate.getMonth()+1)
    console.log('endDate for trial:'+endDate)
    return endDate
}

async function insertSubscription(subscription){

    subscription.c_ts=new Date()
    subscription.u_ts=new Date()
    try{
        await subscription.save()
    }catch(err){
        console.log('error saving subscription'+subscription);
        throw err
    }
}

async function upsertSubscriptionByRazorpayId(subscription){

    const setOnInsertObj={
        c_ts:new Date()
    }

    subscription.u_ts=new Date()
    try{
        await subscription.update({razorpay_id: subscription.razorpay_id},{$set:{subscription},$setOnInsert:{setOnInsertObj}},{upsert:true})
    }catch(err){
        console.log('error saving subscription'+subscription);
        throw err
    }
}

async function disableTrial(userId){
    try{
        console.log('disabiling trial for user:'+userId)
        await Subscription.update({user_id: userId, plan_id: constants.TRIAL_PLAN_ID, status: SUBSCRIPTION_STATUS.ACTIVE.id},{$set:{status:SUBSCRIPTION_STATUS.EXPIRED.id,u_ts: new Date()}})
    }catch(err){
        console.log(err)
        throw err
    }
}

async function getSubscriptionByLicenseKey(licenseKey){
    try{
        if(!licenseKey){
            throw new InvalidLicenseError('Invalid License :'+licenseKey)
        }
        let user=await User.findOne({license_key: licenseKey}).exec()
        if(!user){
            throw new InvalidLicenseError('Invalid License:'+licenseKey)
        }
        let subscription= await Subscription.findOne({user_id: user._id,status: constants.SUBSCRIPTION_STATUS.ACTIVE.id,end_date:{$gt:new Date()}}).exec()
        return subscription
    }catch(err){
        console.log(err)
        throw err
    }
}

async function validateLicenseKey(licenseKey){

    try{
        let subscription= await getSubscriptionByLicenseKey(licenseKey)
        if(subscription && subscription.quantity>0){
            console.log('license active!');
            return true;
        }
        console.log('license expired!');
        return false
    }catch(err){
        console.log(err)
        throw err
    }
}

async function constructLicenseValidationResponse(licenseKey){
    let responseBody={}
    try{
        if(!licenseKey){
            throw new InvalidLicenseError('licenseKey is empty')
        }
        responseBody.status=await validateLicenseKey(licenseKey)
        if(responseBody.status){
            responseBody.statusCode=200
            responseBody.message='success'
        }else{
            responseBody.statusCode=403
            responseBody.message='license expired'
        }
    }catch(err){
        console.log(err)
        responseBody.status=false
        if(err instanceof InvalidLicenseError){
            responseBody.statusCode=403
            responseBody.message='Invalid License'
        }else{
            responseBody.statusCode=500
            responseBody.message='Internal Server Error'
        }
    }
    return responseBody
}

async function processSubscriptionActivatedEvent(data){

    try{
        let subscriptionData= data.payload.subscription.entity

        let user=userService.getUserByRazorpayId(subscriptionData.customer_id)

        if(!user){
            let userData=userService.getUserFromRazorPay(subscriptionData.customer_id)
            user=userService.createUser(userData.email,userData.id)
        }
        disableTrial(user._id)
        let subscription=new Subscription({
            user_id: user._id,
            plan_id: subscriptionData.plan_id,
            end_date: subscriptionData.current_end,
            quantity: subscriptionData.quantity,
            status: constants.SUBSCRIPTION_STATUS.ACTIVE.id,
            razorpay_id: subscriptionData.id
        })
        await upsertSubscriptionByRazorpayId(subscription)
    }catch(err){
        console.log(err)
        throw err
    }
}

module.exports={
    createUserAndActivateTrial,
    validateLicenseKey,
    constructLicenseValidationResponse,
    getSubscriptionByLicenseKey,
    processSubscriptionActivatedEvent,
    processSubscriptionHaltEvent
}