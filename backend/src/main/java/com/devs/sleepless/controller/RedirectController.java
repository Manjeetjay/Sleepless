package com.devs.sleepless.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.beans.factory.annotation.Value;

@Controller
public class RedirectController {

    @Value("${frontend.url}")
    private String frontendUrl;

    @GetMapping("/**")
    public String redirect() {
        return "redirect:" + frontendUrl;
    }
}
